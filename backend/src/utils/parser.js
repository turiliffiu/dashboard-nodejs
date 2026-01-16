/**
 * Parsa un file di procedura con formato specifico
 * 
 * Formato:
 * [SEZIONE]
 * Descrizione sezione
 * 
 * COMANDO: Descrizione comando
 * comando riga 1
 * comando riga 2
 * 
 * @param {string} content - Contenuto file
 * @returns {Array} Array di sezioni con comandi
 */
function parseFile(content) {
  const sections = [];
  let currentSection = null;
  const lines = content.trim().split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Nuova sezione
    if (line.startsWith('[') && line.endsWith(']')) {
      // Salva sezione precedente
      if (currentSection) {
        sections.push(currentSection);
      }

      const sectionName = line.substring(1, line.length - 1);
      i += 1;

      // Salta righe vuote
      while (i < lines.length && !lines[i].trim()) {
        i += 1;
      }

      // Leggi descrizione sezione
      let sectionDesc = '';
      if (i < lines.length) {
        sectionDesc = lines[i].trim();
      }

      currentSection = {
        title: sectionName,
        desc: sectionDesc,
        commands: [],
      };
    }
    // Nuovo comando
    else if (line.startsWith('COMANDO:')) {
      const label = line.replace('COMANDO:', '').trim();
      i += 1;

      // Raccogli tutte le righe del comando
      const cmdLines = [];
      while (i < lines.length) {
        const nextLine = lines[i].trim();

        // Stop se nuova sezione o comando
        if (
          (nextLine.startsWith('[') && nextLine.endsWith(']')) ||
          nextLine.startsWith('COMANDO:')
        ) {
          break;
        }

        // Aggiungi riga (anche vuota per formattazione)
        cmdLines.push(lines[i].rstrip ? lines[i].rstrip() : lines[i].trimEnd());
        i += 1;
      }

      // Unisci righe mantenendo newline
      const cmd = cmdLines.join('\n').trim();

      if (currentSection && cmd) {
        currentSection.commands.push({
          label,
          cmd,
        });
      }

      // Decrementa perché while lo incrementerà
      i -= 1;
    }

    i += 1;
  }

  // Aggiungi ultima sezione
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Evidenzia occorrenze di query nel testo con tag <mark>
 * 
 * @param {string} text - Testo da evidenziare
 * @param {string} query - Query da cercare
 * @returns {string} Testo con <mark> tags
 */
function highlightText(text, query) {
  if (!text || !query) {
    return text || '';
  }

  // Escape caratteri speciali regex
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Case-insensitive replace con tag <mark>
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const highlighted = text.replace(regex, '<mark class="highlight">$1</mark>');

  return highlighted;
}

/**
 * Rimuove tag HTML da una stringa
 * 
 * @param {string} html - HTML string
 * @returns {string} Testo senza tag
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Converte sezioni parsate in formato file txt
 * 
 * @param {Array} sections - Array di sezioni
 * @returns {string} Contenuto file formattato
 */
function sectionsToFileContent(sections) {
  let content = '';

  sections.forEach((section, sectionIndex) => {
    // Sezione
    content += `[${section.title}]\n`;
    if (section.desc) {
      content += `${section.desc}\n`;
    }
    content += '\n';

    // Comandi
    section.commands.forEach((command, commandIndex) => {
      content += `COMANDO: ${command.label}\n`;
      content += `${command.cmd}\n`;

      // Aggiungi riga vuota tra comandi (tranne ultimo)
      if (commandIndex < section.commands.length - 1) {
        content += '\n';
      }
    });

    // Aggiungi riga vuota tra sezioni (tranne ultima)
    if (sectionIndex < sections.length - 1) {
      content += '\n';
    }
  });

  return content;
}

module.exports = {
  parseFile,
  highlightText,
  stripHtml,
  sectionsToFileContent,
};
