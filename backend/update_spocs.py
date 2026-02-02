import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Bot, SPOC
import math

def update_spocs():
    db = SessionLocal()
    try:
        df = pd.read_excel(r'd:\Adani_projects\RPA_Dashboard\data\Final_bible.xlsx')
        
        updated_count = 0
        created_spocs = 0
        
        for index, row in df.iterrows():
            use_case = row.get('Use Case Name')
            spoc_name = row.get('Business SPOC')
            spoc_email = row.get('BU Spoc Email Id')
            spoc_phone = row.get('BU Spoc PH No')
            
            # Skip if Use Case or SPOC name is missing
            if pd.isna(use_case) or pd.isna(spoc_name):
                continue
                
            use_case = str(use_case).strip()
            spoc_name = str(spoc_name).strip()
            
            # Handle potential NaN for email/phone
            spoc_email = str(spoc_email).strip() if not pd.isna(spoc_email) else None
            spoc_phone = str(spoc_phone).strip() if not pd.isna(spoc_phone) else None
            
            # Normalize Use Case for fuzzy matching
            def normalize(s):
                return "".join(c for c in str(s) if c.isalnum()).lower()
                
            clean_use_case = normalize(use_case)
            
            # Find Bot (Try exact, then normalized)
            bot = db.query(Bot).filter(Bot.use_case_name == use_case).first()
            if not bot:
                # Try normalized match in Python (less efficient but safer for this scale)
                all_bots = db.query(Bot).all()
                bot = next((b for b in all_bots if normalize(b.use_case_name) == clean_use_case), None)
            
            if not bot:
                print(f"MISMATCH: Excel '{use_case}' (norm: {clean_use_case}) - No matching Bot found in DB.")
                continue
            
            # Find or Create SPOC
            spoc = db.query(SPOC).filter(SPOC.name == spoc_name).first()
            if not spoc:
                print(f"NEW SPOC DETECTED: '{spoc_name}'")
                spoc = SPOC(
                    name=spoc_name,
                    email=spoc_email,
                    phone=spoc_phone
                )
                db.add(spoc)
                db.flush()
                created_spocs += 1
            else:
                # Update SPOC details if changed
                if spoc_email and spoc.email != spoc_email:
                    print(f"SPOC Update ({spoc.name}): Email '{spoc.email}' -> '{spoc_email}'")
                    spoc.email = spoc_email
                if spoc_phone and spoc.phone != spoc_phone:
                    print(f"SPOC Update ({spoc.name}): Phone '{spoc.phone}' -> '{spoc_phone}'")
                    spoc.phone = spoc_phone
            
            # Check for Link Mismatch
            current_spoc_name = bot.spoc.name if bot.spoc else "None"
            if current_spoc_name != spoc_name:
                print(f"BOT UPDATE NEEDED: '{bot.use_case_name}'")
                print(f"   - Current DB SPOC: {current_spoc_name}")
                print(f"   - Excel New SPOC:  {spoc_name}")
                bot.spoc_id = spoc.id
                updated_count += 1
            else:
                pass # print(f"MATCH: {bot.use_case_name} has correct SPOC.")
                
        db.commit()
                
        db.commit()
        print(f"SUCCESS: Updated {updated_count} bots with SPOC info.")
        print(f"Created {created_spocs} new SPOC entries.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_spocs()
