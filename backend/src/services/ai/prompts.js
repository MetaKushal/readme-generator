/**
 * Used for INITIAL generation — requires repo context fetched from GitHub.
 */
export function buildReadmePrompt(context, chatHistory = [], userPrompt = null) {
  const basePrompt = `
    You are an expert software architect. Generate a highly professional, comprehensive README.md for the following repository.
    
    Repository: ${context.owner}/${context.repo}
    Dependencies: ${JSON.stringify(context.dependencies)}
    File Tree: \n${context.fileTree.slice(0, 400).join('\n')} 
    
    Requirements:
    1. Include a catchy title and description.
    2. Document inferred installation and running steps.
    3. Include a Mermaid.js diagram. CRITICAL: Use valid, simple syntax (e.g., \`graph TD\`). You MUST enclose all node labels in quotes (e.g., A["Component Name"]) to prevent syntax errors. Do not use unescaped special characters in node IDs.
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
    3. Output ONLY valid markdown. Do not wrap the response in a markdown code block.
  `;
}