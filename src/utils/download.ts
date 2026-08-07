// DOWNLOAD DE ARQUIVO GERADO NO NAVEGADOR
//
// A demonstração não guarda bytes de arquivo: anexo é só nome, porque o estado
// inteiro vai para o localStorage. Então os botões de download aqui entregam o
// que o app REALMENTE tem — o índice/os metadados do documento, em texto —, em
// vez de fingir baixar um PDF que não existe. O conteúdo gerado diz isso na
// primeira linha, para ninguém receber o arquivo e achar que é o original.

/** Dispara o download de um conteúdo de texto gerado na hora. */
export function baixarTexto(nomeArquivo: string, conteudo: string, mime = 'text/plain;charset=utf-8') {
  // BOM na frente: sem ele o Excel abre o CSV com acentuação quebrada.
  const blob = new Blob([`﻿${conteudo}`], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Sem revogar, o blob fica preso na memória da aba até o reload.
  URL.revokeObjectURL(url);
}

/** Monta um CSV simples (separador ";", padrão que o Excel pt-BR abre direto). */
export function montarCSV(cabecalho: string[], linhas: (string | number | undefined)[][]): string {
  const escapar = (valor: string | number | undefined) => {
    const texto = String(valor ?? '').replace(/"/g, '""');
    return /[";\n]/.test(texto) ? `"${texto}"` : texto;
  };
  return [cabecalho, ...linhas].map(linha => linha.map(escapar).join(';')).join('\r\n');
}

/** Nome de arquivo seguro: sem acento, espaço nem barra. */
export function nomeSeguro(texto: string): string {
  return texto
    // NFD separa a letra do acento ("ê" vira "e" + circunflexo combinante). O
    // acento tem de ser APAGADO aqui: se sobrar para a troca seguinte, vira
    // hífen e parte a palavra no meio ("residência" -> "reside-ncia").
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}
