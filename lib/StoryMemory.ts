export interface StoryNode {
  id: string;
  text: string;
  timestamp: number;
  type: 'narrative' | 'user_action' | 'user_writing';
  embedding?: number[]; 
}

export class StoryMemory {
  private nodes: StoryNode[] = [];

  addNode(text: string, type: StoryNode['type']) {
    const node: StoryNode = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      timestamp: Date.now(),
      type,
    };
    this.nodes.push(node);
    return node;
  }

  // M4-style Retrieval: Returns recent narrative context + actions
  getContext(query: string): string {
    const narratives = this.nodes.filter(n => n.type === 'narrative');
    const actions = this.nodes.filter(n => n.type !== 'narrative').slice(-3);

    const recentNarratives = narratives.slice(-4);
    
    let context = "";
    if (recentNarratives.length > 0) {
      context += "Story So Far:\n" + recentNarratives.map(n => n.text).join("\n\n") + "\n\n";
    }
    if (actions.length > 0) {
      context += "Recent Events:\n" + actions.map(n => `> ${n.text}`).join("\n");
    }
    
    return context;
  }

  getFullStory(): string {
    return this.nodes.map(n => {
      const prefix = n.type === 'user_writing' ? "[USER INSERT]: " : 
                     n.type === 'user_action' ? "[PROTAGONIST]: " : "";
      return `${prefix}${n.text}`;
    }).join("\n\n");
  }

  clear() {
    this.nodes = [];
  }
}