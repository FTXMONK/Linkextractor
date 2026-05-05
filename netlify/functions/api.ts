import serverless from 'serverless-http';
import app from '../../api/app.ts';

export const handler = serverless(app);
