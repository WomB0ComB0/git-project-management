declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_TOKEN_M: string;
      GITHUB_TOKEN_R: string;
      GITHUB_TOKEN_D: string;
      REPO_OWNER: string;
      REPO_NAME: string;
    }
  }
}

export { }