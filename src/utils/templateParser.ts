export interface TemplateSection {
  title: string;
  hint: string | null;
  checkboxes: string[];
  content: string;
  startLine: number;
  endLine: number;
  isAuthorReminders: boolean;
}

export class TemplateParser {
  /**
   * Parse markdown template into structured sections
   */
  parseTemplate(templateContent: string): TemplateSection[] {
    const lines = templateContent.split('\n');
    const sections: TemplateSection[] = [];
    let currentSection: Partial<TemplateSection> | null = null;
    let currentContent: string[] = [];
    let lineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect section headers (## Header)
      if (line.startsWith('## ')) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = currentContent.join('\n');
          currentSection.endLine = i - 1;
          sections.push(currentSection as TemplateSection);
        }

        // Start new section
        const title = line.substring(3).trim();
        currentSection = {
          title,
          hint: null,
          checkboxes: [],
          content: '',
          startLine: i,
          endLine: i,
          isAuthorReminders: title.toLowerCase().includes('author reminder') || 
                            title.toLowerCase().includes('reminders')
        };
        currentContent = [line];
      } else if (currentSection) {
        currentContent.push(line);
        
        // Extract HTML comments as hints
        const hintMatch = line.match(/<!--\s*(.+?)\s*-->/);
        if (hintMatch && !currentSection.hint) {
          currentSection.hint = hintMatch[1];
        }

        // Extract checkboxes
        const checkboxMatch = line.match(/^-\s*\[\s*\]\s*(.+)$/);
        if (checkboxMatch && currentSection.checkboxes) {
          currentSection.checkboxes.push(checkboxMatch[1]);
        }
      } else {
        // Content before first section
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n');
      currentSection.endLine = lines.length - 1;
      sections.push(currentSection as TemplateSection);
    }

    return sections;
  }

  /**
   * Extract section by title
   */
  findSection(sections: TemplateSection[], titleKeyword: string): TemplateSection | null {
    return sections.find(section => 
      section.title.toLowerCase().includes(titleKeyword.toLowerCase())
    ) || null;
  }

  /**
   * Reconstruct template with filled content
   */
  reconstructTemplate(sections: TemplateSection[]): string {
    return sections.map(section => section.content).join('\n');
  }
}




