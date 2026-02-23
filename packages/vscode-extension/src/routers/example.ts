import router from '../lib/socket-router';

router.add('test', (query) => ({ status: 'success', message: 'Test successful', query }));
