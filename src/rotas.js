const express = require("express");
const { listarContasBancarias, criarContaBancaria, atualizarConta, deletarConta, depositar, sacar, transferir, exibirSaldo, exibirExtrato } = require("./controladores/banco");

const rotas = express();

rotas.get("/contas", listarContasBancarias);
rotas.post("/contas", criarContaBancaria);
rotas.put("/contas/:numeroConta/usuario", atualizarConta);
rotas.delete("/contas/:numeroConta", deletarConta);

rotas.post("/transacoes/depositar", depositar);
rotas.post("/transacoes/sacar", sacar);
rotas.post("/transacoes/transferir", transferir);
rotas.get("/contas/saldo", exibirSaldo);
rotas.get("/contas/extrato", exibirExtrato);

module.exports = rotas;