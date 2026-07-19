const fs = require('fs');
let content = fs.readFileSync('src/components/Crm.tsx', 'utf8');

const replacement = `
        ) : (
          <div className="h-full relative px-8 py-6 flex items-center group/kanban">
            <button 
              onClick={() => {
                const el = document.getElementById('kanban-scroll-container');
                if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
              }}
              className="absolute left-2 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-200 text-gray-400 hover:text-[#F26522] opacity-0 group-hover/kanban:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div id="kanban-scroll-container" className="h-full overflow-x-auto snap-x snap-mandatory flex gap-4 custom-scrollbar w-full relative">
              {COLUMNS.map(column => {
`;

content = content.replace(`
        ) : (
          <div className="h-full px-8 py-6 overflow-x-auto snap-x snap-mandatory flex gap-4 custom-scrollbar">
            {COLUMNS.map(column => {
`, replacement);


const replacement2 = `
            })}
            </div>
            <button 
              onClick={() => {
                const el = document.getElementById('kanban-scroll-container');
                if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
              }}
              className="absolute right-2 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-200 text-gray-400 hover:text-[#F26522] opacity-0 group-hover/kanban:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
`;

content = content.replace(`
            })}
          </div>
        )}
`, replacement2);

fs.writeFileSync('src/components/Crm.tsx', content);
