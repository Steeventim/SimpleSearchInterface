module.exports = {
  apps: [{
    name: 'search-engine',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Configuration des logs
    log_file: './logs/app.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Redémarrage automatique
    watch: false,
    max_memory_restart: '1G',
    
    // Variables d'environnement depuis le fichier
    env_file: '.env.production'
  }]
}
