import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('voxdental.db')
        cursor = conn.cursor()
        
        # Intentar añadir la columna profile_image
        print("Añadiendo columna 'profile_image' a la tabla 'users'...")
        cursor.execute("ALTER TABLE users ADD COLUMN profile_image TEXT")
        
        conn.commit()
        conn.close()
        print("¡Migración completada con éxito!")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("La columna ya existe. No es necesaria la migración.")
        else:
            print(f"Error en la migración: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")

if __name__ == "__main__":
    migrate()
