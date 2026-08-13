/**
 * SIMULADOR DO FORMULÁRIO — auditoria da retenção de valor digitado
 * =====================================================================
 *
 * Rodar:  npx tsx auditoria/simular-formulario.tsx
 *         npx tsx auditoria/simular-formulario.tsx --json   (saída JSON)
 *
 * Monta o FormRenderer REAL em jsdom, com o AppConfigProvider REAL, e digita
 * nos campos como uma pessoa digita — uma tecla por vez, sem esperar o
 * round-trip de estado entre uma tecla e a seguinte.
 *
 * É esse "sem esperar" que reproduz o defeito relatado: digitar 40 gravava 4,
 * digitar 20/09/2026 gravava 20/09/202, e clicar numa opção do select não
 * fixava o valor (pelo teclado funcionava — a pausa natural entre focar, setear
 * e confirmar dava tempo do round-trip fechar).
 *
 * O QUE É REAL E O QUE É ESPELHO
 * ------------------------------
 * - REAL: FormRenderer, Select, AnchoredDropdown, AppConfigProvider e as
 *   definições de processo de PROCESS_DEFINITIONS. Nada é reimplementado.
 * - ESPELHO: `PainelDoFormulario` reproduz a fiação do RHRequestForm — estado
 *   espelho no pai, alimentado por `onDataChange` e devolvido como
 *   `initialData`. É a fiação, não o componente: se RHRequestForm mudar de
 *   contrato, este espelho precisa acompanhar.
 */

import { JSDOM } from 'jsdom';

// ---------------------------------------------------------------------------
// jsdom ANTES de qualquer import de React — react-dom lê o document na carga.
// ---------------------------------------------------------------------------
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true
});

const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
// `navigator` já existe no Node 21+ e só tem getter — precisa de defineProperty.
Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true, writable: true });
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.getComputedStyle = dom.window.getComputedStyle;
g.localStorage = dom.window.localStorage;
g.sessionStorage = dom.window.sessionStorage;
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as unknown as number;
g.cancelAnimationFrame = (id: number) => clearTimeout(id);
g.IS_REACT_ACT_ENVIRONMENT = true;

async function main() {
  const React = (await import('react')).default;
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');

  const { FormRenderer } = await import('../src/components/FormRenderer');
  const { AppConfigProvider } = await import('../src/contexts/AppConfigContext');
  const { ToastProvider } = await import('../src/components/ToastContext');
  const { PROCESS_DEFINITIONS } = await import('../src/processDefinitions');
  const { computeDerivedFields } = await import('../src/utils/computedFields');

  type Nivel = 'ok' | 'falha';
  interface Verificacao { nivel: Nivel; grupo: string; titulo: string; detalhe: string }
  const verificacoes: Verificacao[] = [];
  const jsonMode = process.argv.includes('--json');

  const checar = (grupo: string, titulo: string, condicao: boolean, detalhe: string) =>
    void verificacoes.push({ nivel: condicao ? 'ok' : 'falha', grupo, titulo, detalhe });

  // -------------------------------------------------------------------------
  // Espelho da fiação do RHRequestForm (RHRequestForm.tsx:396-406)
  // -------------------------------------------------------------------------
  let ultimoDadoDoPai: Record<string, any> = {};
  let rendersDoPai = 0;

  /**
   * Guarda contra o laço: sem ela, o defeito não FALHA — ele trava o processo,
   * porque o formulário e o espelho do pai se perseguem sem parar. Estourar
   * aqui transforma "o teste pendura" em "o teste acusa".
   */
  const LIMITE_DE_RENDERS = 60;

  function PainelDoFormulario({ processId }: { processId: string }) {
    const definition = PROCESS_DEFINITIONS[processId];
    // Mesmo estado espelho do RHRequestForm: alimenta a barra lateral (prévia
    // de alçadas, contador de obrigatórios) e é devolvido ao FormRenderer.
    const [currentFormData, setCurrentFormData] = React.useState<any>({});
    ultimoDadoDoPai = currentFormData;
    if (++rendersDoPai > LIMITE_DE_RENDERS) {
      throw new Error(`LAÇO: o painel renderizou mais de ${LIMITE_DE_RENDERS} vezes — o estado do formulário e o espelho do pai estão se perseguindo.`);
    }

    return React.createElement(FormRenderer, {
      definition,
      initialData: currentFormData,
      onSubmit: () => undefined,
      onCancel: () => undefined,
      onDataChange: (data: any) => setCurrentFormData(data),
      hideActions: true
    });
  }

  // -------------------------------------------------------------------------
  // Montagem e digitação
  // -------------------------------------------------------------------------
  const montar = async (processId: string) => {
    const container = document.getElementById('root')!;
    container.innerHTML = '';
    const host = document.createElement('div');
    container.appendChild(host);
    const root = createRoot(host);
    rendersDoPai = 0;
    await act(async () => {
      root.render(
        React.createElement(AppConfigProvider, null,
          React.createElement(ToastProvider, null,
            React.createElement(PainelDoFormulario, { processId })))
      );
    });
    return { host, root };
  };

  /** Roda uma interação acusando o laço em vez de pendurar o processo. */
  const interagir = async (fn: () => Promise<void>): Promise<string | null> => {
    rendersDoPai = 0;
    // O React grita "Maximum update depth exceeded" antes de desistir; o ruído
    // não ajuda a ler o relatório e o erro já é acusado pelo limite de renders.
    const erroOriginal = console.error;
    console.error = (...a: any[]) =>
      String(a[0]).includes('Maximum update depth') ? undefined : erroOriginal(...a);
    try {
      await fn();
      return null;
    } catch (e: any) {
      return e?.message || String(e);
    } finally {
      console.error = erroOriginal;
    }
  };

  const setarValorNativo = (input: any, valor: string) => {
    // O setter nativo é o caminho que o React reconhece como mudança real do
    // input controlado — atribuir `.value` direto não dispara o tracker.
    const proto = valor === undefined ? null : Object.getPrototypeOf(input);
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    desc?.set?.call(input, valor);
  };

  /**
   * Digita caractere a caractere SEM esperar o round-trip entre as teclas — é
   * assim que uma pessoa digita, e é o que o defeito não suportava.
   */
  const digitar = async (input: any, texto: string) => {
    await act(async () => {
      for (const ch of texto) {
        setarValorNativo(input, (input.value ?? '') + ch);
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      }
    });
  };

  const acharInput = (host: HTMLElement, fieldId: string): any => {
    const wrapper = host.querySelector(`#field-${fieldId}`);
    return wrapper?.querySelector('input, textarea');
  };

  // =========================================================================
  // 1. Campo numérico — dois dígitos gravam dois dígitos
  // =========================================================================
  {
    const G = '1. Campo numérico retém os dígitos';
    const casos: { processId: string; processo: string; fieldId: string; digitado: string }[] = [
      { processId: '9', processo: 'Solicitação de Férias', fieldId: 'diasGozo', digitado: '40' },
      { processId: '1', processo: 'Requisição de Vaga', fieldId: 'quantidadeVagas', digitado: '12' },
      { processId: '14', processo: 'Treinamento', fieldId: 'cargaHoraria', digitado: '36' }
    ];

    for (const caso of casos) {
      const { host, root } = await montar(caso.processId);
      const input = acharInput(host, caso.fieldId);
      if (!input) {
        checar(G, `${caso.processo} · campo '${caso.fieldId}' existe`, false, 'campo não encontrado no DOM');
        await act(async () => root.unmount());
        continue;
      }
      const laco = await interagir(() => digitar(input, caso.digitado));
      const gravado = String(ultimoDadoDoPai[caso.fieldId] ?? '');
      checar(G, `${caso.processo} · digitar "${caso.digitado}" grava "${caso.digitado}"`,
        !laco && gravado === caso.digitado,
        laco || `input exibe "${input.value}" · estado do formulário: "${gravado}"`);
      await act(async () => root.unmount());
    }
  }

  // =========================================================================
  // 2. Campo de data — a data completa é gravada
  // =========================================================================
  {
    const G = '2. Campo de data retém a data completa';
    const casos: { processId: string; processo: string; fieldId: string; digitado: string; esperado: string }[] = [
      { processId: '9', processo: 'Solicitação de Férias', fieldId: 'dataInicio', digitado: '20092026', esperado: '20/09/2026' },
      { processId: '1', processo: 'Requisição de Vaga', fieldId: 'dataDesejada', digitado: '15112026', esperado: '15/11/2026' },
      { processId: '11', processo: 'Movimentação de Pessoal', fieldId: 'vigencia', digitado: '01122026', esperado: '01/12/2026' }
    ];

    for (const caso of casos) {
      const { host, root } = await montar(caso.processId);
      const input = acharInput(host, caso.fieldId);
      if (!input) {
        checar(G, `${caso.processo} · campo '${caso.fieldId}' existe`, false, 'campo não encontrado no DOM');
        await act(async () => root.unmount());
        continue;
      }
      const laco = await interagir(() => digitar(input, caso.digitado));
      const gravado = String(ultimoDadoDoPai[caso.fieldId] ?? '');
      checar(G, `${caso.processo} · digitar "${caso.digitado}" grava "${caso.esperado}"`,
        !laco && gravado === caso.esperado,
        laco || `input exibe "${input.value}" · estado do formulário: "${gravado}"`);
      await act(async () => root.unmount());
    }
  }

  // =========================================================================
  // 3. Select — clique do mouse fixa o valor
  // =========================================================================
  {
    const G = '3. Select fixa o valor no clique do mouse';
    const casos: { processId: string; processo: string; fieldId: string }[] = [
      { processId: '9', processo: 'Solicitação de Férias', fieldId: 'periodoAquisitivo' },
      { processId: '1', processo: 'Requisição de Vaga', fieldId: 'tipoContrato' },
      { processId: '8', processo: 'Prestação de Contas', fieldId: 'tipoDespesa' }
    ];

    for (const caso of casos) {
      const { host, root } = await montar(caso.processId);
      const wrapper = host.querySelector(`#field-${caso.fieldId}`);
      const nativo: any = wrapper?.querySelector('select');
      const gatilho: any = wrapper?.querySelector('button');

      if (nativo) {
        // <select> nativo: o clique do mouse é o evento 'change' do browser.
        const opcoes = Array.from(nativo.options).filter((o: any) => o.value) as any[];
        const alvo = opcoes[opcoes.length - 1];
        const laco = await interagir(async () => {
          await act(async () => {
            setarValorNativo(nativo, alvo.value);
            nativo.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
          });
        });
        const gravado = String(ultimoDadoDoPai[caso.fieldId] ?? '');
        checar(G, `${caso.processo} · escolher "${alvo.value}" no select fixa o valor`,
          !laco && gravado === alvo.value,
          laco || `<select> nativo · estado do formulário: "${gravado}"`);
      } else if (gatilho) {
        // ui/Select (AnchoredDropdown): abre e clica na opção com o mouse.
        await act(async () => { gatilho.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
        const opcoes = Array.from(document.body.querySelectorAll('div[class*="z-[1000]"] button')) as any[];
        const alvo = opcoes[opcoes.length - 1];
        if (!alvo) {
          checar(G, `${caso.processo} · dropdown de '${caso.fieldId}' abre`, false, 'nenhuma opção renderizada');
        } else {
          const rotulo = alvo.textContent;
          await act(async () => {
            alvo.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true }));
            document.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true }));
          });
          const gravado = String(ultimoDadoDoPai[caso.fieldId] ?? '');
          checar(G, `${caso.processo} · clicar em "${rotulo}" fixa o valor`,
            gravado !== '' && rotulo?.includes(gravado) === true,
            `ui/Select · estado do formulário: "${gravado}"`);
        }
      } else {
        checar(G, `${caso.processo} · campo '${caso.fieldId}' existe`, false, 'nenhum select encontrado');
      }
      await act(async () => root.unmount());
    }
  }

  // =========================================================================
  // 4. Validação de saldo — 40 dias com saldo de 30 tem de bloquear
  // =========================================================================
  {
    const G = '4. Validação de saldo de férias';
    const { host, root } = await montar('9');
    const definition = PROCESS_DEFINITIONS['9'];
    const campoDias: any = definition.steps[0].fields.find((f: any) => (f.id || f.name) === 'diasGozo');

    // O saldo sai do período aquisitivo escolhido: "2024/2025 (30 dias)" com
    // zero dias já gozados = 30 de saldo. Escolhe pelo select, como o usuário.
    const wrapperPeriodo = host.querySelector('#field-periodoAquisitivo');
    const selectPeriodo: any = wrapperPeriodo?.querySelector('select');
    if (selectPeriodo) {
      await act(async () => {
        setarValorNativo(selectPeriodo, '2024/2025 (30 dias)');
        selectPeriodo.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      });
    }
    const input = acharInput(host, 'diasGozo');

    if (!input || !campoDias) {
      checar(G, 'campo "Dias Solicitados" existe e tem validação', false,
        `input=${!!input} · campo=${!!campoDias} · validation=${typeof campoDias?.validation}`);
    } else {
      await digitar(input, '40');
      const dados = computeDerivedFields(definition, ultimoDadoDoPai);
      const saldo = dados.saldoDisponivel;
      const erro = campoDias.validation(dados.diasGozo, dados);

      checar(G, 'o período aquisitivo escolhido chega ao formulário',
        String(ultimoDadoDoPai.periodoAquisitivo || '').includes('30 dias'),
        `periodoAquisitivo = "${ultimoDadoDoPai.periodoAquisitivo}"`);
      checar(G, 'saldo disponível calculado = 30', saldo === 30,
        `saldoDisponivel = ${saldo} · diasGozadosHist = ${dados.diasGozadosHist}`);
      checar(G, 'os 40 dias digitados chegam inteiros à validação', dados.diasGozo === 40,
        `diasGozo = ${JSON.stringify(dados.diasGozo)}`);
      checar(G, 'pedir 40 dias com saldo de 30 é bloqueado', !!erro,
        erro ? `mensagem: "${erro}"` : 'NENHUM erro — o envio seria liberado');
      checar(G, 'a mensagem de bloqueio fala em saldo', !!erro && /saldo|dispon/i.test(String(erro)),
        erro ? `"${erro}"` : '(sem mensagem)');
      // O erro também tem de aparecer na tela, não só na função de validação.
      checar(G, 'o formulário exibe o erro no campo',
        (host.querySelector('#field-diasGozo')?.textContent || '').includes('Excede o saldo'),
        `texto do campo: "${(host.querySelector('#field-diasGozo')?.textContent || '').slice(-60)}"`);

      // E o caminho feliz continua passando.
      await act(async () => {
        setarValorNativo(input, '');
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
      await digitar(input, '10');
      const dadosOk = computeDerivedFields(definition, ultimoDadoDoPai);
      checar(G, 'pedir 10 dias com saldo de 30 passa', !campoDias.validation(dadosOk.diasGozo, dadosOk),
        `diasGozo = ${JSON.stringify(dadosOk.diasGozo)}`);
    }
    await act(async () => root.unmount());
  }

  // =========================================================================
  // 5. ui/Select — o clique do mouse na opção fixa o valor
  // =========================================================================
  // A suspeita original era o `onMouseDown` da opção (ui/Select.tsx:56) sendo
  // cancelado pelo fechamento do AnchoredDropdown. Não era — mas ui/Select é
  // usado em 13 telas (Central Adm, filtros, Perfil 360), então fica coberto.
  {
    const G = '5. ui/Select (Central Adm e filtros)';
    const { Select } = await import('../src/components/ui/Select');

    let valor = '';
    function Harness() {
      const [v, setV] = React.useState('');
      valor = v;
      return React.createElement(Select, {
        value: v,
        onChange: setV,
        ariaLabel: 'Escopo',
        options: [
          { value: 'proprio', label: 'Próprio' },
          { value: 'equipe', label: 'Equipe' },
          { value: 'empresa', label: 'Empresa' }
        ]
      });
    }

    const host = document.createElement('div');
    document.getElementById('root')!.appendChild(host);
    const root = createRoot(host);
    await act(async () => { root.render(React.createElement(Harness)); });

    const gatilho: any = host.querySelector('button');
    await act(async () => { gatilho.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
    const opcoes = Array.from(document.body.querySelectorAll('div[class*="z-[1000]"] button')) as any[];

    checar(G, 'o dropdown abre com as opções', opcoes.length === 3, `${opcoes.length} opção(ões) no portal`);

    if (opcoes.length) {
      const alvo = opcoes[1]; // "Equipe"
      await act(async () => {
        // Sequência real do mouse: mousedown na opção e o mousedown que o
        // AnchoredDropdown escuta no document para fechar ao clicar fora.
        alvo.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true }));
        document.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true }));
      });
      checar(G, 'clicar em "Equipe" com o mouse fixa o valor', valor === 'equipe',
        `valor após o clique: "${valor}"`);
      checar(G, 'o dropdown fecha depois da escolha',
        document.body.querySelectorAll('div[class*="z-[1000]"] button').length === 0,
        'nenhuma opção continua no portal');
      checar(G, 'o gatilho passa a exibir o rótulo escolhido',
        (host.querySelector('button')?.textContent || '').includes('Equipe'),
        `gatilho: "${host.querySelector('button')?.textContent}"`);
    }
    await act(async () => root.unmount());
  }

  // =========================================================================
  // 6. Ponta a ponta no RHRequestForm REAL
  // =========================================================================
  // As seções 1-4 usam a fiação ORIGINAL (o pai devolvendo o próprio espelho
  // como `initialData`) — de propósito: é o caso difícil, e prova que o
  // FormRenderer ficou imune por conta própria. Aqui roda a tela de verdade.
  {
    const G = '6. Ponta a ponta — tela de Solicitação de Férias';
    const RHRequestForm = (await import('../src/components/RHRequestForm')).default;

    const host = document.createElement('div');
    document.getElementById('root')!.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        React.createElement(AppConfigProvider, null,
          React.createElement(ToastProvider, null,
            React.createElement(RHRequestForm, { requestId: '9', onBack: () => undefined })))
      );
    });

    const campoDias = host.querySelector('#field-diasGozo');
    const input: any = campoDias?.querySelector('input');
    const selectPeriodo: any = host.querySelector('#field-periodoAquisitivo select');

    if (!input || !selectPeriodo) {
      checar(G, 'a tela renderiza os campos de férias', false,
        `input=${!!input} · select=${!!selectPeriodo}`);
    } else {
      await act(async () => {
        setarValorNativo(selectPeriodo, '2024/2025 (30 dias)');
        selectPeriodo.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      });
      await digitar(input, '40');

      checar(G, 'o campo mostra os 40 digitados', input.value === '40',
        `input.value = "${input.value}"`);
      checar(G, 'o erro de saldo aparece na tela',
        (host.querySelector('#field-diasGozo')?.textContent || '').includes('Excede o saldo'),
        `campo: "${(host.querySelector('#field-diasGozo')?.textContent || '').slice(-55)}"`);

      // O botão "Confirmar e Enviar" fica desabilitado enquanto excede o saldo.
      const botoes = Array.from(host.querySelectorAll('button')) as any[];
      const enviar = botoes.find(b => /Confirmar e Enviar/i.test(b.textContent || ''));
      checar(G, 'o botão "Confirmar e Enviar" fica bloqueado', !!enviar && enviar.disabled === true,
        enviar ? `disabled = ${enviar.disabled}` : 'botão não encontrado');

      // Corrigindo para 10 dias, o erro some e o botão volta a depender só dos
      // obrigatórios (a data de início ainda está vazia, então segue bloqueado).
      await act(async () => {
        setarValorNativo(input, '');
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
      await digitar(input, '10');
      checar(G, 'corrigir para 10 dias apaga o erro de saldo',
        !(host.querySelector('#field-diasGozo')?.textContent || '').includes('Excede o saldo'),
        `campo: "${(host.querySelector('#field-diasGozo')?.textContent || '').slice(-55)}"`);
      checar(G, 'o campo mostra os 10 digitados', input.value === '10',
        `input.value = "${input.value}"`);
    }
    await act(async () => root.unmount());
  }

  // -------------------------------------------------------------------------
  // Saída
  // -------------------------------------------------------------------------
  const falhas = verificacoes.filter(v => v.nivel === 'falha');

  if (jsonMode) {
    console.log(JSON.stringify({ total: verificacoes.length, falhas: falhas.length, verificacoes }, null, 2));
  } else {
    let grupoAtual = '';
    for (const v of verificacoes) {
      if (v.grupo !== grupoAtual) {
        grupoAtual = v.grupo;
        console.log(`\n${'='.repeat(78)}\n${grupoAtual}\n${'='.repeat(78)}`);
      }
      console.log(`${v.nivel === 'ok' ? '[  ok  ]' : '[FALHA ]'} ${v.titulo}`);
      if (v.detalhe) console.log(`          ${v.detalhe}`);
    }
    console.log(`\n${'='.repeat(78)}`);
    console.log(`RESUMO: ${verificacoes.length} verificações · ${falhas.length} falhas`);
    console.log('='.repeat(78));
    falhas.forEach(f => console.log(`  FALHA · ${f.grupo} · ${f.titulo}`));
  }

  process.exit(falhas.length > 0 ? 1 : 0);
}

main().catch(err => {
  // O laço de re-render escapa do `act()` e chega aqui: é falha de auditoria,
  // não erro de infraestrutura do simulador.
  const msg = err?.message || String(err);
  if (msg.startsWith('LAÇO')) {
    console.log(`\n${'='.repeat(78)}`);
    console.log('FALHA · o formulário entrou em laço de re-render e a auditoria não pôde continuar.');
    console.log(msg);
    console.log('='.repeat(78));
    process.exit(1);
  }
  console.error(err);
  process.exit(2);
});
