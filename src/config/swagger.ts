import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Akazi Nexus Protocol Documentation',
      version: '1.0.0',
      description: 'The complete neural API documentation for the Akazi recruitment platform. This interface provides detailed specifications for authentication, talent management, AI screening, and operational analytics.',
      contact: {
        name: 'Nexus Support',
        url: 'http://localhost:5000',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Nexus Development Node',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
