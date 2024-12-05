describe('API User Creation Tests', () => {
    const apiUrl = 'http://localhost:3000/api/routes/signin'; // Atualize a URL conforme necessário
  
    it('should successfully create a user', () => {
      const newUser = {
        email: `user${Date.now()}@example.com`,
        password: 'password123'
      };
  
      cy.request('POST', apiUrl, newUser)
        .then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body).to.have.property('message', 'User created successfully');
        });
    });
  
    it('should return an error when email is missing', () => {
      const newUser = {
        password: 'password123'
      };
  
      cy.request({
        method: 'POST',
        url: apiUrl,
        body: newUser,
        failOnStatusCode: false, // Permite capturar erros do servidor
      }).then((response) => {
        expect(response.status).to.eq(400); // Status de erro esperado
        expect(response.body).to.have.property('error', 'Email and password are required');
      });
    });
  
    it('should return an error when the email already exists', () => {
      const existingUser = {
        email: 'existing@example.com',
        password: 'password123'
      };
  
      // Cria o usuário inicial
      cy.request('POST', apiUrl, existingUser)
        .then(() => {
          // Tenta criar o mesmo usuário novamente
          cy.request({
            method: 'POST',
            url: apiUrl,
            body: existingUser,
            failOnStatusCode: false, // Permite capturar o erro esperado
          }).then((response) => {
            expect(response.status).to.eq(409); // Código de conflito
            expect(response.body).to.have.property('error', 'User with this email already exists');
          });
        });
    });
  
    it('should return an error for invalid JSON format', () => {
      cy.request({
        method: 'POST',
        url: apiUrl,
        body: 'Invalid JSON',
        headers: {
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('error', 'Invalid JSON format');
      });
    });
  });