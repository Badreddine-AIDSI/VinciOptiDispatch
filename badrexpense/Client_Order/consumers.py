import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Technician
from django.utils import timezone
from django.db import connection
import traceback

class TechnicianConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        # Add to technicians group
        await self.channel_layer.group_add("technicians", self.channel_name)
        print("Added to technicians group")
        
        # Send initial technician data
        technicians = await self.get_technicians()
        for tech in technicians:
            print(f"Sent initial technician data: {tech['name']}")
            await self.send(text_data=json.dumps(tech))

    async def disconnect(self, close_code):
        # Leave technicians group
        await self.channel_layer.group_discard("technicians", self.channel_name)
        print(f"WebSocket disconnected with code: {close_code}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data['type'] == 'location_update':
            technician_id = data['id']
            latitude = data['latitude']
            longitude = data['longitude']
            
            # Use the fixed update_technician_location method
            success = await self.update_technician_location(technician_id, latitude, longitude)
            
            if success:
                # Get updated technician data
                updated_tech = await self.get_updated_technician(technician_id)
                
                # Broadcast to all clients in the group
                await self.channel_layer.group_send(
                    'technicians',
                    {
                        'type': 'send_technician_location',
                        'id': updated_tech['id'],
                        'name': updated_tech['name'],
                        'status': updated_tech['status'],
                        'latitude': updated_tech['latitude'],
                        'longitude': updated_tech['longitude'],
                    }
                )

    async def technician_location(self, event):
        # Send to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'technician_id': event['technician_id'],
            'latitude': event['latitude'],
            'longitude': event['longitude'],
        }))

    async def send_technician_location(self, event):
        """Handler for send_technician_location event type"""
        message = {
            "type": "location_update",
            "id": event["id"],
            "name": event["name"],
            "status": event["status"],
            "latitude": event["latitude"],
            "longitude": event["longitude"],
            "timestamp": timezone.now().isoformat()
        }
        
        print(f"Broadcasting to client: {message}")
        await self.send(text_data=json.dumps(message))

    @database_sync_to_async
    def get_technicians(self):
        """Get all technicians from database"""
        technicians = []
        for tech in Technician.objects.all():
            technicians.append({
                "id": tech.id,
                "name": tech.name,
                "status": tech.status,
                "latitude": float(tech.latitude) if tech.latitude else None,
                "longitude": float(tech.longitude) if tech.longitude else None,
                "type": "location_update"
            })
        return technicians
    
    @database_sync_to_async
    def check_technician_exists(self, tech_id):
        """Check if a technician exists by ID"""
        return Technician.objects.filter(id=tech_id).exists()
    
    @database_sync_to_async
    def update_technician_directly(self, tech_id, update_data):
        """Update technician fields directly through ORM"""
        try:
            # Debug: Print what we're about to update
            print(f"Updating technician ID {tech_id} with data: {update_data}")
            
            # Use a direct Django filter update instead of raw SQL
            # This is safer and works across different database backends
            affected = Technician.objects.filter(id=tech_id).update(**update_data)
            
            print(f"Update completed via ORM. Rows affected: {affected}")
            
            # Verify update worked
            try:
                tech_after = Technician.objects.get(id=tech_id)
                print(f"After update: ID={tech_after.id}, Status={tech_after.status}, Lat={tech_after.latitude}, Lon={tech_after.longitude}")
            except Exception as e:
                print(f"Error verifying update: {e}")
            
            # Return success based on rows affected
            return affected > 0
            
        except Exception as e:
            print(f"Error in direct update: {str(e)}")
            traceback.print_exc()
            return False
    
    @database_sync_to_async
    def get_updated_technician(self, tech_id):
        """Get the updated technician data after an update"""
        try:
            tech = Technician.objects.get(id=tech_id)
            return {
                "id": tech.id,
                "name": tech.name,
                "status": tech.status,
                "latitude": float(tech.latitude) if tech.latitude else None,
                "longitude": float(tech.longitude) if tech.longitude else None
            }
        except Technician.DoesNotExist:
            return None

    @database_sync_to_async
    def debug_technician_table(self):
        """Debug the technician table schema"""
        try:
            cursor = connection.cursor()
            
            # Get table schema
            cursor.execute("PRAGMA table_info(Client_Order_technician)")
            columns = cursor.fetchall()
            print("=== TECHNICIAN TABLE SCHEMA ===")
            for col in columns:
                print(col)
            
            # List all technicians
            cursor.execute("SELECT id, name, status, latitude, longitude FROM Client_Order_technician")
            rows = cursor.fetchall()
            print("=== ALL TECHNICIANS ===")
            for row in rows:
                print(row)
            
            return True
        except Exception as e:
            print(f"Error debugging table: {str(e)}")
            traceback.print_exc()
            return False

    @database_sync_to_async
    def update_technician_location(self, technician_id, latitude, longitude):
        """Update technician location in the database"""
        try:
            # First check if technician exists
            if not Technician.objects.filter(id=technician_id).exists():
                print(f"Technician with ID {technician_id} does not exist")
                return False
            
            # Update using direct ORM
            update_data = {
                'latitude': latitude,
                'longitude': longitude,
            }
            
            affected = Technician.objects.filter(id=technician_id).update(**update_data)
            return affected > 0
            
        except Exception as e:
            print(f"Error updating technician location: {str(e)}")
            import traceback
            traceback.print_exc()
            return False