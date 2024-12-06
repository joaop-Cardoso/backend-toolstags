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
});
