// DEBUG 1: Se esta mensagem aparecer, o arquivo foi carregado e executado.
console.log("Arquivo script.js INICIADO.");

const testComponent = {
    // Nossas variáveis (propriedades)
    message: 'Funcionou! O Petite-Vue está conectado corretamente.'
};

// DEBUG 2: Se esta mensagem aparecer, o objeto do componente foi criado.
console.log("Objeto 'testComponent' criado. Tentando montar a aplicação Petite-Vue...");

try {
    // Montamos nosso componente na página
    PetiteVue.createApp(testComponent).mount();

    // DEBUG 3: Se esta mensagem aparecer, o comando de montagem foi executado sem erros.
    console.log("Comando '.mount()' executado com sucesso.");
} catch (error) {
    // DEBUG 4: Se houver um erro grave durante a montagem, ele será capturado aqui.
    console.error("ERRO GRAVE ao tentar montar a aplicação Petite-Vue:", error);
}