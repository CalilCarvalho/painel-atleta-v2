document.addEventListener('alpine:init', () => {
    
    Alpine.data('testComponent', () => ({
        
        message: 'Funcionou! O Alpine.js está conectado corretamente ao script.'
        
    }));

});