import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('voxdental.db')
        cursor = conn.cursor()
        
        print("Añadiendo columna 'gender' a la tabla 'users'...")
        # Añadimos gender con un valor por defecto para que no haya errores
        cursor.execute("ALTER TABLE users ADD COLUMN gender TEXT DEFAULT 'other'")
        
        conn.commit()
        conn.close()
        print("¡Migración de género completada con éxito!")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("La columna 'gender' ya existe.")
        else:
            print(f"Error en la migración: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")

if __name__ == "__main__":
    migrate()
