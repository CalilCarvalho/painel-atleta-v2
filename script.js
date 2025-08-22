// DEBUG: Para confirmar que o script está carregando
console.log("Arquivo script.js (versão 'init') carregado.");

// Quando usamos 'init', apenas definimos a função que o v-scope irá chamar.
// Não usamos mais o comando PetiteVue.createApp().mount().
function testComponent() {
  return {
    message: 'Funcionou! O método com "init" está correto.'
  };
}