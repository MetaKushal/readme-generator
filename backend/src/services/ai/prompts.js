/**
 * Used for INITIAL generation — requires repo context fetched from GitHub.
 */
export function buildReadmePrompt(context) {
  const basePrompt = `
    You are an expert software architect. Generate a highly professional, comprehensive README.md for the following repository.
    
    Repository: ${context.owner}/${context.repo}
    Dependencies: ${JSON.stringify(context.dependencies)}
    File Tree: \n${context.fileTree.slice(0, 400).join('\n')} 
    
    Requirements:
    1. Include a catchy title and description.
    2. Document inferred installation and running steps.
    3. Include a Mermaid.js diagram representing the architecture. 
       CRITICAL RULES FOR MERMAID: 
       - KEEP IT HIGH-LEVEL: Maximum 8-10 nodes total. Do not attempt to map every file.
       - Use ONLY valid, basic syntax (\`graph TD\`). 
       - Node IDs MUST be simple uppercase letters (A, B, C, etc.).
       - You MUST enclose all node labels in double quotes (e.g., A["User Interface"]). 
       - ABSOLUTELY NO NESTED QUOTES. Use single quotes or parentheses inside labels instead.
       - If you label the relationship edges, you MUST use the pipe syntax WITHOUT QUOTES: A -->|Action Label| B
       - DO NOT USE A -- "Label" --> B. IT WILL CRASH.
       - YOU MUST CLOSE the mermaid code block with \`\`\` immediately after the diagram ends.
       - STRICT EXAMPLE TO FOLLOW:
         \`\`\`mermaid
         graph TD
             A["User Interface"] --> B["Frontend React"]
             B -->|Generate Request| C["Backend Node.js"]
             C -->|Fetch Data| D["GitHub API"]
         \`\`\`
    4. Keep the tone technical, clear, and structured.
    5. Output ONLY valid markdown. Do not wrap the entire response in a markdown code block, just return the raw markdown text.
  `;

  return basePrompt;
}

/**
 * Used for REFINEMENT — no GitHub fetch needed.
 * Takes the current README (last assistant message) + the user's change request.
 */
export function buildRefinementPrompt(currentReadme, userPrompt) {
  return `
    You are an expert technical writer. The user wants to refine an existing README.md.

    CURRENT README:
    ${currentReadme}

    USER REQUEST: "${userPrompt}"

    Instructions:
    1. Apply the user's requested changes to the README.
    2. Return the COMPLETE updated README.md — do not omit unchanged sections.
    3. Output ONLY valid markdown. Do not wrap the entire response in a markdown code block, just return the raw markdown text.
    4. CRITICAL MERMAID RULES: If your updates involve modifying or adding a Mermaid diagram, you MUST keep it high-level (under 10 nodes). ALWAYS wrap node labels in double quotes (A["Node"]), NEVER use nested quotes. If labeling edges, use A -- "Action" --> B. Ensure the \`\`\` code block is properly closed.
  `;
}