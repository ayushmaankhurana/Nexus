// export const ENV = {
//   API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
//   API_VERSION: "v1",
//   get apiUrl() {
//     return `${this.API_BASE_URL}/api/${this.API_VERSION}`;
//   },
// } as const;
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  get apiUrl() {
    return this.API_BASE_URL;
  },
} as const;