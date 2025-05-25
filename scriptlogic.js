class LogicCalculator {
    constructor() {
        this.display = document.getElementById('display');
        this.expression = '';
        this.lastInput = '';
        this.validOperators = ['^', 'v', '⊕', '->', '<->'];
        this.setupEventListeners();
    }

    setupEventListeners() {
        const buttons = document.querySelectorAll('.button');
        buttons.forEach(button => {
            const operation = button.getAttribute('data-operation') || button.innerText;
            button.addEventListener('click', () => this.handleButtonClick(operation));
        });
    }

    updateDisplay(value) {
        this.display.innerText = value;
    }

    isOperator(char) {
        return this.validOperators.includes(char) || char === '~';
    }

    isValidInput(currentInput) {
        if (this.expression === '' && ['0', '1', '(', '~'].indexOf(currentInput) === -1) {
            return false;
        }

        const lastChar = this.expression.slice(-1);

        if (this.isOperator(lastChar) && this.isOperator(currentInput)) {
            return false;
        }

        if (['0', '1'].includes(lastChar) && !this.isOperator(currentInput) && currentInput !== ')') {
            return false;
        }

        if (lastChar === '(' && ['0', '1', '(', '~'].indexOf(currentInput) === -1) {
            return false;
        }

        if (lastChar === ')' && currentInput !== ')' && !this.isOperator(currentInput)) {
            return false;
        }

        return true;
    }

    handleButtonClick(value) {
        if (value === 'C') {
            this.expression = '';
            this.updateDisplay('0');
            return;
        }

        if (value === '=') {
            try {
                if (!this.isValidExpression()) {
                    throw new Error('Logika salah');
                }
                const result = this.evaluateLogicalExpression(this.expression);
                this.updateDisplay(result);
                this.expression = result.toString();
            } catch (error) {
                this.updateDisplay('Error: Logika salah');
                this.expression = '';
            }
            return;
        }

        if (value === 'del') {
            if (this.expression.length > 0) {
                if (this.expression.endsWith('<->')) {
                    this.expression = this.expression.slice(0, -3);
                } else if (this.expression.endsWith('->')) {
                    this.expression = this.expression.slice(0, -2);
                } else {
                    this.expression = this.expression.slice(0, -1);
                }
            }
            this.updateDisplay(this.expression || '0');
            return;
        }

        let inputToAdd = '';
        switch (value) {
            case 'AND': inputToAdd = '^'; break;
            case 'OR': inputToAdd = 'v'; break;
            case 'XOR': inputToAdd = '⊕'; break;
            case 'NOT': inputToAdd = '~'; break;
            case 'IMPLIES': inputToAdd = '->'; break;
            case 'BICOND': inputToAdd = '<->'; break;
            default: inputToAdd = value;
        }

        if (this.isValidInput(inputToAdd)) {
            this.expression += inputToAdd;
            this.updateDisplay(this.expression);
        }
    }

    isValidExpression() {
        let parenthesesCount = 0;
        for (let char of this.expression) {
            if (char === '(') parenthesesCount++;
            if (char === ')') parenthesesCount--;
            if (parenthesesCount < 0) return false;
        }
        if (parenthesesCount !== 0) return false;

        const lastChar = this.expression.slice(-1);
        if (this.isOperator(lastChar) || lastChar === '(') return false;

        if (this.expression.includes('()')) return false;

        return true;
    }

    evaluateLogicalExpression(expr) {
        const tokens = this.tokenize(expr);
        const postfix = this.infixToPostfix(tokens);
        return this.evaluatePostfix(postfix);
    }

    tokenize(expr) {
        const tokens = [];
        let i = 0;

        while (i < expr.length) {
            if (expr[i] === ' ') {
                i++;
                continue;
            }

            if (expr[i] === '-' && expr[i + 1] === '>') {
                tokens.push('->');
                i += 2;
                continue;
            }

            if (expr[i] === '<' && expr[i + 1] === '-' && expr[i + 2] === '>') {
                tokens.push('<->');
                i += 3;
                continue;
            }

            if ('01()~^v⊕'.includes(expr[i])) {
                tokens.push(expr[i]);
                i++;
                continue;
            }

            throw new Error('Token salah');
        }

        return tokens;
    }

    getPrecedence(operator) {
        const precedence = {
            '~': 4,
            '^': 3,
            'v': 2,
            '⊕': 2,
            '->': 1,
            '<->': 1
        };
        return precedence[operator] || 0;
    }

    infixToPostfix(tokens) {
        const output = [];
        const stack = [];

        for (let token of tokens) {
            if (token === '0' || token === '1') {
                output.push(token);
            } else if (token === '(') {
                stack.push(token);
            } else if (token === ')') {
                while (stack.length > 0 && stack[stack.length - 1] !== '(') {
                    output.push(stack.pop());
                }
                stack.pop();
            } else {
                while (
                    stack.length > 0 &&
                    stack[stack.length - 1] !== '(' &&
                    this.getPrecedence(stack[stack.length - 1]) >= this.getPrecedence(token)
                ) {
                    output.push(stack.pop());
                }
                stack.push(token);
            }
        }

        while (stack.length > 0) {
            const operator = stack.pop();
            if (operator === '(' || operator === ')') {
                throw new Error('Tanda kurung salah');
            }
            output.push(operator);
        }

        return output;
    }

    evaluatePostfix(postfix) {
        const stack = [];

        for (let token of postfix) {
            if (token === '0' || token === '1') {
                stack.push(token === '1');
            } else if (token === '~') {
                if (stack.length < 1) throw new Error('Logika salah');
                stack.push(!stack.pop());
            } else {
                if (stack.length < 2) throw new Error('Logika salah');
                const b = stack.pop();
                const a = stack.pop();

                switch (token) {
                    case '^':
                        stack.push(a && b);
                        break;
                    case 'v':
                        stack.push(a || b);
                        break;
                    case '⊕':
                        stack.push(a !== b);
                        break;
                    case '->':
                        stack.push(!a || b);
                        break;
                    case '<->':
                        stack.push(a === b);
                        break;
                    default:
                        throw new Error('Operator salah');
                }
            }
        }

        if (stack.length !== 1) throw new Error('Logika salah');
        return stack.pop() ? '1' : '0';
    }
}

const calculator = new LogicCalculator();
