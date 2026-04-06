import { FastifyPluginAsync } from 'fastify';
import { IncidentService } from '../services/incident-service';

const incidentService = new IncidentService();

const incidents: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/incidents',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as any;
      const query = request.query as {
        status?: string;
        assignedTo?: string;
      };

      const callerRole = String(user.role).toUpperCase();
      const isPrivileged = callerRole === 'ADMIN' || callerRole === 'SECURITY';

      const results = await incidentService.listIncidents({
        status: query.status,
        assignedTo: query.assignedTo,
        accountId: isPrivileged ? undefined : user.sub,
      });

      return reply.code(200).send({
        data: results,
        total: results.length,
        page: 1,
        pageSize: results.length,
        totalPages: 1,
      });
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/incidents/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as any;
      const callerRole = String(user.role).toUpperCase();
      const isPrivileged = callerRole === 'ADMIN' || callerRole === 'SECURITY';

      const incident = await incidentService.getIncidentById(request.params.id);

      if (!incident) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Incident not found',
          },
        });
      }

      if (!isPrivileged && incident.studentId !== user.sub) {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this incident',
          },
        });
      }

      return reply.code(200).send(incident);
    }
  );

  fastify.post(
    '/incidents',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as any;
      const body = request.body as {
        accountId?: string;
        title: string;
        type?: string;
        description: string;
        severity?: 'low' | 'medium' | 'high' | 'critical';
        assignedTo?: string;
      };

      const callerRole = String(user.role).toUpperCase();
      const isPrivileged = callerRole === 'ADMIN' || callerRole === 'SECURITY';

      const created = await incidentService.createIncident({
        accountId: isPrivileged ? (body.accountId || user.sub) : user.sub,
        title: body.title,
        type: body.type || 'MANUAL',
        description: body.description,
        severity: body.severity ? body.severity.toUpperCase() as any : undefined,
        assignedTo: body.assignedTo ?? null,
      });

      return reply.code(201).send(created);
    }
  );

  fastify.patch<{ Params: { id: string } }>(
    '/incidents/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as any;
      const callerRole = String(user.role).toUpperCase();
      const isPrivileged = callerRole === 'ADMIN' || callerRole === 'SECURITY';

      if (!isPrivileged) {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'Only admin or security can update incidents',
          },
        });
      }

      const body = request.body as {
        status?: string;
        assignedTo?: string | null;
        severity?: string;
        title?: string;
        description?: string;
      };

      const updated = await incidentService.updateIncident(request.params.id, body);
      return reply.code(200).send(updated);
    }
  );

  fastify.post<{ Params: { id: string } }>(
    '/incidents/:id/assign',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as any;
      const callerRole = String(user.role).toUpperCase();

      if (callerRole !== 'ADMIN' && callerRole !== 'SECURITY') {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'Only admin or security can assign incidents',
          },
        });
      }

      const body = request.body as { assignedTo: string };
      const updated = await incidentService.assignIncident(request.params.id, body.assignedTo);
      return reply.code(200).send(updated);
    }
  );

  fastify.post<{ Params: { id: string } }>(
    '/incidents/:id/resolve',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as any;
      const callerRole = String(user.role).toUpperCase();

      if (callerRole !== 'ADMIN' && callerRole !== 'SECURITY') {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'Only admin or security can resolve incidents',
          },
        });
      }

      const updated = await incidentService.resolveIncident(request.params.id);
      return reply.code(200).send(updated);
    }
  );
};

export default incidents;