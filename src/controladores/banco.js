let { banco, contas, usuario, saques, depositos, transferencias, NumeroDaConta, saldo } = require("../dados/bancodedados");
const { format } = require("date-fns");

function validarCamposObrigatorios(req, res, campos) {
    for (const campo of campos) {
        if (!req.body[campo]) {
            return res.status(400).json({ mensagem: `O campo ${campo} é obrigatório.` });
        }
    }
}

function validarCamposObrigatorios2(req, res, campos) {
    for (const campo of campos) {
        if (!req.query[campo]) {
            return res.status(400).json({ mensagem: `O campo ${campo} é obrigatório.` });
        }
    }
}

function verificarContasComMesmoEmailOuCpf(req, res, contas, cpf, email) {
    const contaComMesmoCpf = contas.find((conta) => conta.usuario.cpf === cpf);
    const contaComMesmoEmail = contas.find((conta) => conta.usuario.email === email);

    if (contaComMesmoCpf) {
        return res.status(400).json({ mensagem: "O CPF informado já existe cadastrado!" });
    }

    if (contaComMesmoEmail) {
        return res.status(400).json({ mensagem: "O E-mail informado já existe cadastrado!" });
    }
}

const listarContasBancarias = (req, res) => {
    const { senha_banco } = req.query;


    try {
        validarCamposObrigatorios2(req, res, ['senha_banco']);

        if (senha_banco !== banco.senha) {
            return res.status(404).json({
                mensagem: "A senha do banco informada é inválida!"
            });
        } else {
            return res.status(200).json(contas);
        }
    } catch (error) {
        return res.status(400).json({ mensagem: error.message });
    }
}
const criarContaBancaria = (req, res) => {
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    try {
        validarCamposObrigatorios(req, res, ['nome', 'cpf', 'data_nascimento', 'telefone', 'email', 'senha']);

        verificarContasComMesmoEmailOuCpf(req, res, contas, cpf, email);

        const usuario = {
            NumeroDaConta: NumeroDaConta++,
            saldo: 0,
            nome,
            cpf,
            data_nascimento,
            telefone,
            email,
            senha
        }

        contas.push(usuario);

        return res.status(201).json();

    } catch (error) {
        return res.status(400).json({ mensagem: error.message });
    }
}

const atualizarConta = (req, res) => {
    const { numeroConta } = req.params;
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    try {
        validarCamposObrigatorios(req, res, ['nome', 'cpf', 'data_nascimento', 'telefone', 'email', 'senha']);

        const contaEncontrada = contas.find((conta) => {
            return conta.NumeroDaConta === Number(numeroConta);
        });

        if (!contaEncontrada) {
            return res.status(404).json({ mensagem: "Número da conta não encontrado." });
        }

        verificarContasComMesmoEmailOuCpf(req, res, contas, cpf, email);

        contaEncontrada.usuario.nome = nome;
        contaEncontrada.usuario.cpf = cpf;
        contaEncontrada.usuario.data_nascimento = data_nascimento;
        contaEncontrada.usuario.telefone = telefone;
        contaEncontrada.usuario.email = email;
        contaEncontrada.usuario.senha = senha;

        return res.status(204).json();
    } catch (error) {
        return res.status(400).json({ mensagem: error.message });
    }
}

const deletarConta = (req, res) => {
    const { numeroConta } = req.params;

    try {
        const contaEncontrada = contas.find((conta) => {
            return conta.NumeroDaConta === Number(numeroConta);
        });

        if (!contaEncontrada) {
            return res.status(404).json({ mensagem: "Número da conta não encontrado." });
        }

        if (isNaN(numeroConta)) {
            return res.status(404).json({ mensagem: "O número da conta deve ser um número válido." });
        }

        if (!contaEncontrada) {
            return res.status(404).json({ mensagem: "Conta não foi encontrada." });
        }

        if (contaEncontrada.saldo !== 0) {
            return res.status(404).json({ mensagem: "A conta só pode ser removida se o saldo for zero!" });
        }

        contas = contas.filter((conta) => {
            return conta.NumeroDaConta !== Number(numeroConta);
        });

        return res.status(204).json();
    } catch (error) {
        return res.status(400).json({ mensagem: error.message });
    }
}

const depositar = (req, res) => {
    const { numero_conta, valor } = req.body;
    const date = new Date();
    let dateFormatada = format(date, "yyyy-MM-dd kk:mm:ss");

    try {
        if (isNaN(numero_conta || valor)) {
            return res.status(404).json({ mensagem: "O número da conta e valor deve ser um número válido." });
        }

        if (valor <= 0) {
            return res.status(404).json({ mensagem: "O valor não pode ser menor que zero!" });
        }

        if (!numero_conta || !valor) {
            return res.status(404).json({ mensagem: "O número da conta e o valor são obrigatórios!" });
        }

        const contaEncontrada = contas.find((conta) => {
            return conta.NumeroDaConta === Number(numero_conta);
        });

        if (!contaEncontrada) {
            return res.status(404).json({ mensagem: "Número da conta não encontrado." });
        }

        contaEncontrada.saldo += valor;

        depositos.push({
            data: dateFormatada,
            numero_conta: numero_conta,
            valor: valor
        })

        return res.status(204).json();
    } catch (error) {
        return res.status(400).json({ mensagem: error.message });
    }
}

const sacar = (req, res) => {
    const { numero_conta, valor, senha } = req.body;
    const date = new Date();
    let dateFormatada = format(date, "yyyy-MM-dd kk:mm:ss");

    try {
        validarCamposObrigatorios(req, res, ['numero_conta', 'valor', 'senha']);

        const contaEncontrada = contas.find((conta) => {
            return conta.NumeroDaConta === Number(numero_conta);
        });

        if (!contaEncontrada) {
            return res.status(404).json({ mensagem: "Número da conta não encontrado." });
        }

        if (contaEncontrada.usuario.senha !== Number(senha)) {
            return res.status(404).json({ mensagem: "Senha Incorreta!" });
        }

        if (contaEncontrada.saldo < valor) {
            return res.status(404).json({ mensagem: "Valor Insuficiente!" });
        }

        contaEncontrada.saldo -= valor;

        saques.push({
            data: dateFormatada,
            numero_conta: numero_conta,
            valor: valor
        })

        return res.status(204).json();
    } catch (error) {
        return res.status(400).json({ mensagem: error.message });
    }
}

const transferir = (req, res) => {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;
    const date = new Date();
    let dateFormatada = format(date, "yyyy-MM-dd kk:mm:ss");

    try {
        validarCamposObrigatorios(req, res, ['numero_conta_origem', 'numero_conta_destino', 'valor', 'senha']);

        const contaEncontradaOrigem = contas.find((conta) => {
            return conta.NumeroDaConta === Number(numero_conta_origem);
        });

        if (!contaEncontradaOrigem) {
            return res.status(404).json({ mensagem: "Número da conta de origem não encontrado." });
        }

        if (contaEncontradaOrigem.saldo < valor) {
            return res.status(404).json({ mensagem: "Valor Insuficiente!" });
        }

        const contaEncontradaDestino = contas.find((conta) => {
            return conta.NumeroDaConta === Number(numero_conta_destino);
        });

        if (!contaEncontradaDestino) {
            return res.status(404).json({ mensagem: "Número da conta de destino não encontrado." });
        }

        if (contaEncontradaOrigem.usuario.senha !== Number(senha)) {
            return res.status(404).json({ mensagem: "Senha Incorreta!" });
        }

        contaEncontradaOrigem.saldo -= valor;
        contaEncontradaDestino.saldo += valor;

        transferencias.push({
            data: dateFormatada,
            numero_conta_origem: numero_conta_origem,
            numero_conta_destino: numero_conta_destino,
            valor: valor
        })

        return res.status(204).json();
    } catch (error) {
        return res.status(400).json({ mensagem: error.message });
    }
}

const exibirSaldo = (req, res) => {
    const { numero_conta, senha } = req.query;

    try {
        validarCamposObrigatorios2(req, res, ['numero_conta', 'senha']);

        const contaEncontrada = contas.find((conta) => {
            return conta.NumeroDaConta === Number(numero_conta);
        });

        if (!contaEncontrada) {
            return res.status(404).json({ mensagem: "Conta bancária não encontada." });
        }

        if (contaEncontrada.usuario.senha !== Number(senha)) {
            return res.status(404).json({
                mensagem: "A senha informada é inválida!"
            });
        }

        return res.status(200).json(`saldo: ${contaEncontrada.saldo}`)
    } catch (error) {
        return res.status(400).json({ mensagem: error.message });
    }
}

const exibirExtrato = (req, res) => {
    const { numero_conta, senha } = req.query;

    try {
        validarCamposObrigatorios2(req, res, ['numero_conta', 'senha']);

        const contaEncontrada = contas.find((conta) => {
            return conta.NumeroDaConta === Number(numero_conta);
        });

        if (!contaEncontrada) {
            return res.status(404).json({ mensagem: "Conta bancária não encontada." });
        }

        if (contaEncontrada.usuario.senha !== Number(senha)) {
            return res.status(404).json({
                mensagem: "A senha informada é inválida!"
            });
        }

        const exibirDepositos = depositos.filter((deposito) => {
            return deposito.numero_conta === numero_conta;
        });

        const exibirSaque = saques.filter((saque) => {
            return saque.numero_conta === numero_conta;
        });

        const exibirTransferenciasEnviadas = transferencias.filter((transferencia) => {
            return transferencia.numero_conta_origem === numero_conta;
        });

        const exibirTransferenciasRecebidas = transferencias.filter((transferencia) => {
            return transferencia.numero_conta_destino === numero_conta;
        });

        return res.status(200).json({
            depositos: exibirDepositos,
            saques: exibirSaque,
            transferenciasEnviadas: exibirTransferenciasEnviadas,
            transferenciasRecebidas: exibirTransferenciasRecebidas
        });
    } catch (error) {
        return res.status(400).json({ mensagem: error.message });
    }
}

module.exports = {
    listarContasBancarias,
    criarContaBancaria,
    atualizarConta,
    deletarConta,
    depositar,
    sacar,
    transferir,
    exibirSaldo,
    exibirExtrato
}