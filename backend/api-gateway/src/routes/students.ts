import { FastifyPluginAsync } from 'fastify';

const students: FastifyPluginAsync = async (fastify) => {
  fastify.get('/students/me', async (request, reply) => {
    // Placeholder: mock student data
    return {
      id: 'student::S12345',
      rollNumber: 'S12345',
      name: 'Nexus Student',
      email: 'student@campus.edu',
      program: 'BTech',
      batch: '2026',
    };
  });
};

export default students;