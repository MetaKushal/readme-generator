import axios from 'axios';

const GITHUB_API = 'https://api.github.com';

export async function fetchRepoContext(repoUrl) {
    try {
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) throw new Error("Invalid GitHub URL format.");

        const [_, owner, repo] = match;
        const cleanRepo = repo.replace('.git', '');

        // 1. Get default branch
        const { data: repoData } = await axios.get(`${GITHUB_API}/repos/${owner}/${cleanRepo}`);
        const defaultBranch = repoData.default_branch;

        // 2. Fetch full tree
        const { data: treeData } = await axios.get(
            `${GITHUB_API}/repos/${owner}/${cleanRepo}/git/trees/${defaultBranch}?recursive=1`
        );

        // 3. Compress tree by filtering out noise
        const ignoredPatterns = [/\/node_modules\//, /\/\./, /\.png$/, /\.jpg$/, /\.svg$/, /-lock\.json$/];
        const fileTree = treeData.tree
            .filter(item => item.type === 'blob')
            .map(item => item.path)
            .filter(path => !ignoredPatterns.some(regex => regex.test(path)));

        // 4. Fetch package.json if it exists to infer tech stack
        let dependencies = {};
        if (fileTree.includes('package.json')) {
            try {
                const { data: pkg } = await axios.get(`https://raw.githubusercontent.com/${owner}/${cleanRepo}/${defaultBranch}/package.json`);
                dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
            } catch (e) {
                console.warn("Could not parse package.json");
            }
        }

        return { owner, repo: cleanRepo, fileTree, dependencies };
    } catch (error) {
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
    }
}