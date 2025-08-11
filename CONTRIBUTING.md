# Contributing to Anubis Chat

First off, thank you for considering contributing to Anubis Chat! It's people like you that make Anubis Chat such a great tool. We welcome any and all contributions.

This document provides guidelines for contributing to the project. Please read it carefully to ensure a smooth and effective contribution process.

## Code of Conduct

This project and everyone participating in it is governed by the [Anubis Chat Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

## How Can I Contribute?

There are many ways to contribute, from writing tutorials or blog posts, improving the documentation, submitting bug reports and feature requests or writing code which can be incorporated into Anubis Chat itself.

### Reporting Bugs

- **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/your-username/anubis-chat/issues).
- If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/your-username/anubis-chat/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

- Open a new issue to discuss your enhancement.
- Clearly describe the enhancement, its potential benefits, and provide examples.

## Your First Code Contribution

Unsure where to begin contributing to Anubis Chat? You can start by looking through `good-first-issue` and `help-wanted` issues.

### Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/anubis-chat.git
    cd anubis-chat
    ```
3.  **Install dependencies** using Bun:
    ```bash
    bun install
    ```
4.  **Set up the Convex backend**:
    ```bash
    bun dev:setup
    ```
    Follow the prompts to connect to your Convex account.
5.  **Configure environment variables**. Create a `.env.local` file in `apps/web` and add the necessary variables as described in the root `README.md`.
6.  **Start the development server**:
    ```bash
    bun dev
    ```

### Making Changes

1.  **Create a new branch** for your feature:
    ```bash
    git checkout -b feature/your-amazing-feature
    ```
2.  **Make your changes**. Follow the coding conventions outlined below.
3.  **Ensure code quality**. Before committing, run the following checks:
    ```bash
    bun check       # Format and lint code
    bun check-types # Validate TypeScript types
    ```
    All checks must pass.

### Coding Conventions

We take code quality seriously. Please follow these conventions:

-   **TypeScript**: Use strict mode. Avoid `any` type.
-   **React**: Prefer Server Components. Use Client Components only for interactivity.
-   **Convex**: Follow the established patterns for queries and mutations.
-   **Style**: Adhere to the Biome formatting and linting rules (`bun check`).
-   **AI Agent Guidelines**: For more detailed architectural patterns and conventions, please refer to the [AGENTS.md](AGENTS.md) file. It contains a wealth of information that is also valuable for human developers.

### Pull Request Process

1.  **Commit your changes** with a descriptive commit message following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
    ```bash
    git commit -m "feat: Add amazing new feature"
    ```
2.  **Push your branch** to your fork:
    ```bash
    git push origin feature/your-amazing-feature
    ```
3.  **Open a Pull Request** to the `main` branch of the original repository.
4.  **Provide a clear description** of your changes in the PR.
5.  **Wait for a review**. A project maintainer will review your PR and may suggest changes.

Thank you for your contribution!
