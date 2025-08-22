// A inicialização do Petite-Vue é um pouco diferente

const testComponent = {
    // Nossas variáveis (propriedades)
    message: 'Funcionou! O Petite-Vue está conectado corretamente.'
};

// 'Montamos' nosso componente na página
PetiteVue.createApp(testComponent).mount();