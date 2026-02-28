from threading import Thread
from server import app, manager

updater = Thread(target=manager.update_loop, daemon=True)
updater.start()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
