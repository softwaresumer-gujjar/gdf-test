declare module 'fastify-raw-body' {
  import type { FastifyPluginCallback } from 'fastify';

  type FastifyRawBodyOptions = {
    field?: string;
    global?: boolean;
    encoding?: false | BufferEncoding;
    runFirst?: boolean;
    routes?: string[];
  };

  const plugin: FastifyPluginCallback<FastifyRawBodyOptions>;
  export default plugin;
}
