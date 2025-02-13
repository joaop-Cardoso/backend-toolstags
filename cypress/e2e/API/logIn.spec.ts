describe('API user login tests', () => {
    const apiUrl = 'http://localhost:3000/api/routes/login';
    const existingUser = {
        email: 'existing@example.com',
        password: 'password123'
    };

    it('Should successfully login', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: existingUser,
            failOnStatusCode: false,
        }).then((response) => {
            console.log(process.env.NODE_ENV)
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('success', true);
        });
    });

    it('Should fail to login with invalid password', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: {
                email: existingUser.email,
                password: 'wrongpassword'
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(401);
            expect(response.body).to.have.property('error', 'Invalid credentials');
        });
    });

    it('Should fail to login with non-existent email', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: {
                email: 'nonexistent@example.com',
                password: 'password123'
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.body).to.have.property('error', 'User not found');
        });
    });

    it('Should fail to login with missing fields', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: {
                email: existingUser.email
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property('error', 'Invalid request body');
        });
    });

    it('Should set a cookie on successful login', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: existingUser,
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('success', true);
            expect(response.headers).to.have.property('set-cookie');
            const cookies = response.headers['set-cookie'];
            expect(cookies[0]).to.include('access_token');
        });
    });

    it('Should set secure cookies only in production', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: existingUser,
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(200);
            const cookies = response.headers['set-cookie'];
            if (Cypress.env('NODE_ENV') === 'production') {
                expect(cookies[0]).to.include('Secure');
            } else {
                expect(cookies[0]).not.to.include('Secure');
            }
        });
    });

    it('Should not allow login with incorrect HTTP method', () => {
        cy.request({
            method: 'GET',
            url: apiUrl,
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(405);
        });
    });

    it('Should fail with password shorter than minimum length', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: {
                email: existingUser.email,
                password: '123' // senha curta
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property('error', 'Invalid request body');
        });
    });

    it('Should fail with incorrect data types in payload', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: {
                email: 12345, // Tipo errado (número)
                password: {} // Tipo errado (objeto)
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property('error', 'Invalid request body');
        });
    });

    it('Should fail without Content-Type header', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: existingUser,
            headers: { 'Content-Type': '' }, // Cabeçalho ausente
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property('error', 'The content type for the solicitation must be specified');
        });
    });
    
    it('Should return 400 when no body is sent', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: {}, // Sem campos
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property('error', 'Invalid request body');
        });
    });

    it('Should not expose detailed error messages in production', () => {
        cy.request({
            method: 'POST',
            url: apiUrl,
            body: {
                email: 'malicious@example.com',
                password: 'maliciouspassword'
            },
            failOnStatusCode: false,
        }).then((response) => {
            if (Cypress.env('NODE_ENV') === 'production') {
                expect(response.status).to.be.oneOf([400, 401, 404]);
                expect(response.body).not.to.have.property('issues'); // Não expor detalhes
            }
        });
    });
});
