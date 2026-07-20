# Contributing to Adamas Campus Chatbot

## Welcome!

Thank you for your interest in contributing to the Adamas Campus Chatbot. This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/idk4whatamiusing/synapse.git
   cd synapse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Branch Strategy

- **`main`**: Production-ready code, deployed automatically
- **`develop`**: Integration branch for features, deployed to staging
- **`feature/*`**: New features and enhancements
- **`bugfix/*`**: Bug fixes
- **`hotfix/*`**: Critical production fixes

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Build process or auxiliary tool changes

Example: `feat: add user authentication system`

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes with appropriate tests
3. Ensure `npm test` passes
4. Update documentation as needed
5. Submit PR with clear description
6. Request review from maintainers
7. Address review feedback

## Code Standards

- **ESLint**: Run `npm run lint` before committing
- **Comments**: Document complex logic
- **Error handling**: Use try-catch for external API calls
- **Testing**: Maintain >80% code coverage

## Issue Tracking

All work is tracked via GitHub Issues. Each issue should:
- Have a clear title and description
- Include acceptance criteria
- Reference related issues
- Use appropriate labels

## Getting Help

- Check existing GitHub Issues
- Review the documentation
- Contact the maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.