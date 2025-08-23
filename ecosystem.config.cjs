module.exports = {
  apps: [
    /* 1) Node.js (Express) API */
    {
      name: "wavi-node",
      cwd: "/home/ubuntu/wavi-be",   
      script: "server.js",                   
      instances: 1,                          
      exec_mode: "fork",
      watch: true,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      out_file: "/home/ubuntu/logs/wavi-node.out.log",
      error_file: "/home/ubuntu/logs/wavi-node.err.log",
      time: true,
    },

    /* 2) Flask (Gunicorn) API */
    {
      name: "wavi-flask",
      cwd: "/home/ubuntu/wavi-be",
      script: "/home/ubuntu/wavi-be/venv/bin/gunicorn",
      args: ["-w", "4", "-b", "0.0.0.0:5000", "vectoring:app"],
      exec_mode: "fork",
      interpreter: "none",       
      autorestart: true,
      watch: true,
      max_memory_restart: "300M",
      env: { PYTHONUNBUFFERED: "1" },
      out_file: "/home/ubuntu/logs/wavi-flask.out.log",
      error_file: "/home/ubuntu/logs/wavi-flask.err.log",
      time: true,
      kill_timeout: 5000
    }
  ]
}
