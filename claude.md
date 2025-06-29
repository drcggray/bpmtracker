# Working with Jesse

## Code Writing

- YOU MUST ALWAYS address me as "George" in all communications.
- We STRONGLY prefer simple, clean, maintainable solutions over clever or complex ones. Readability and maintainability are PRIMARY CONCERNS, even at the cost of conciseness or performance.
- YOU MUST make the SMALLEST reasonable changes to achieve the desired outcome.
- Aim to keep files sizes to no more than 300-400 lines, and if you need more lines in a file think about refactoring.
- YOU MUST MATCH the style and formatting of surrounding code, even if it differs from standard style guides. Consistency within a file trumps external standards.
- YOU MUST NEVER make code changes unrelated to your current task. If you notice something that should be fixed but is unrelated, document it rather than fixing it immediately.
- YOU MUST NEVER remove code comments unless you can PROVE they are actively false. Comments are important documentation and must be preserved.
- All code files MUST start with a brief 2-line comment explaining what the file does. Each line MUST start with "ABOUTME: " to make them easily greppable.
- YOU MUST NEVER refer to temporal context in comments (like "recently refactored"). Comments should be evergreen and describe the code as it is.
- YOU MUST NEVER implement mock modes for testing or any purpose. We always use real data and real APIs.
- YOU MUST NEVER throw away implementations to rewrite them without EXPLICIT permission. If you're considering this, YOU MUST STOP and ask first.
- YOU MUST NEVER use temporal naming conventions like 'improved', 'new', or 'enhanced'. All naming should be evergreen.
- YOU MUST NOT change whitespace unrelated to code you're modifying.

## Version Control

- For non-trivial edits, all changes MUST be tracked in git.
- If the project isn't in a git repo, YOU MUST STOP and ask permission to initialize one.
- If there are uncommitted changes or untracked files when starting work, YOU MUST STOP and ask how to handle them. Suggest committing existing work first.
- When starting work without a clear branch for the current task, YOU MUST create a WIP branch.
- YOU MUST commit frequently throughout the development process.

## Getting Help

- YOU MUST ALWAYS ask for clarification rather than making assumptions.
- If you're having trouble, YOU MUST STOP and ask for help, especially for tasks where human input would be valuable.

## Testing

- Tests MUST comprehensively cover ALL implemented functionality. 
- YOU MUST NEVER ignore system or test output - logs and messages often contain CRITICAL information.
- Test output MUST BE PRISTINE TO PASS.
- If logs are expected to contain errors, these MUST be captured and tested.
- NO EXCEPTIONS POLICY: ALL projects MUST have unit tests, integration tests, AND end-to-end tests. The only way to skip any test type is if Jesse EXPLICITLY states: "I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME."

## Test-Driven Development (TDD)

We practice strict TDD. This means:

1. YOU MUST write a failing test that defines the desired functionality BEFORE writing implementation code
2. YOU MUST run the test to confirm it fails as expected
3. YOU MUST write ONLY enough code to make the failing test pass
4. YOU MUST run the test to confirm success
5. YOU MUST refactor code while ensuring tests remain green
6. YOU MUST repeat this process for each new feature or bugfix

## Compliance Check

Before submitting any work, verify that you have followed ALL guidelines above. If you find yourself considering an exception to ANY rule, YOU MUST STOP and get explicit permission from George first.

## User Interface and User Experinece Principles
- We prioritize simplicity and ease of use over advanced features.
- We strive for a consistent and intuitive user experience.
- We aim to minimize cognitive load and provide clear instructions.
- We like the design principles of Apple Inc, because we prioritise the user exeprience above all else.
- We implement best practice UI and UX principles.
- We aim to minimise the thinking the user has to do.
- We aim to minimise the number of mouse clicks the user has to perform, and the amount of distance that the user must drag a mouse or trackpad.
- We aim to minimise the number of keystrokes the user has to perform.
- We aim to minimise the number of steps the user has to perform.
- We aim to minimise the number of screens the user has to navigate through.
- We aim to minimise the number of times the user has to enter the same information.
- We aim to minimise the number of times the user has to make a decision.
- We aim to minimise the number of times the user has to remember something.
- We aim to build AI-first apps so that the power of AI can be used to assist users in making decisions and completing tasks.