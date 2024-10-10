from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
from models import db, User, GHP, CheckedDay, Notes

main = Blueprint('main', __name__)
bcrypt = Bcrypt()

@main.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully"}), 201

@main.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        return jsonify(access_token=access_token, refresh_token=refresh_token), 200
    
    return jsonify({"message": "Invalid credentials"}), 401

@main.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=user_id)
    return jsonify(access_token=new_access_token), 200

@main.route('/verify', methods=['POST'])
@jwt_required()
def verify():
    user_id = get_jwt_identity()
    if user_id:
        return jsonify({"message": "User authenticated"}), 200
    else:
        return jsonify({"message": "User not authenticated"}), 401

@main.route('/ghp', methods=['GET', 'POST'])
@jwt_required()
def handle_ghp():
    user_id = get_jwt_identity()
    
    if request.method == 'GET':
        ghps = GHP.query.filter_by(user_id=user_id).all()
        return jsonify([{"id": ghp.id, "name": ghp.name} for ghp in ghps]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_ghp = GHP(name=data['name'], user_id=user_id)
        db.session.add(new_ghp)
        db.session.commit()
        return jsonify({"id": new_ghp.id, "name": new_ghp.name}), 201

@main.route('/ghp/<int:ghp_id>', methods=['DELETE'])
@jwt_required()
def delete_ghp(ghp_id):
    user_id = get_jwt_identity()
    ghp = GHP.query.filter_by(id=ghp_id, user_id=user_id).first()
    if not ghp:
        return jsonify({"message": "GHP not found or unauthorized"}), 404
    
    # delete checked days associated with the GHP
    CheckedDay.query.filter_by(ghp_id=ghp_id).delete()
    
    db.session.delete(ghp)
    db.session.commit()
    return jsonify({"message": "GHP deleted successfully"}), 200

@main.route('/ghp/<int:ghp_id>/check', methods=['POST'])
@jwt_required()
def check_day(ghp_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    
    ghp = GHP.query.filter_by(id=ghp_id, user_id=user_id).first()
    if not ghp:
        return jsonify({"message": "GHP not found or unauthorized"}), 404
    
    checked_day = CheckedDay.query.filter_by(ghp_id=ghp_id, date=date).first()
    if checked_day:
        # remove notes associated with the checked day
        Notes.query.filter_by(checked_day_id=checked_day.id).delete()
        db.session.delete(checked_day)
    else:
        new_checked_day = CheckedDay(date=date, ghp_id=ghp_id)
        db.session.add(new_checked_day)
    
    db.session.commit()
    return jsonify({"message": "Day toggled successfully"}), 200

@main.route('/checked_days/<int:ghp_id>/<string:date>/notes', methods=['POST', 'GET', 'PUT'])
@jwt_required()
def handle_notes(ghp_id, date):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    checked_day = CheckedDay.query.filter_by(ghp_id=ghp_id, date=date).first()
    if not checked_day:
        return jsonify({"message": "Checked day not found"}), 404
    
    if request.method == 'POST':
        data = request.get_json()
        notes = Notes(html_content=data['html_content'], checked_day_id=checked_day.id)
        db.session.add(notes)
        db.session.commit()
        return jsonify({"message": "Notes updated successfully"}), 200
    
    elif request.method == 'GET':
        notes = Notes.query.filter_by(checked_day_id=checked_day.id).first()
        if not notes:
            return jsonify({"message": "Notes not found"}), 404
        return jsonify({"id": notes.id, "html_content": notes.html_content}), 200
    
    elif request.method == 'PUT':
        data = request.get_json()
        notes = Notes.query.filter_by(checked_day_id=checked_day.id).first()
        if not notes:
            return jsonify({"message": "Notes not found"}), 404
        notes.html_content = data['html_content']
        db.session.commit()
        return jsonify({"message": "Notes updated successfully"}), 200

def get_all_todays_notes(user_id, today):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    ghps = GHP.query.filter_by(user_id=user_id).all()
    todays_notes = {ghp.name: None for ghp in ghps}

    for ghp in ghps:
        checked_day = CheckedDay.query.filter_by(ghp_id=ghp.id, date=today).first()
        if checked_day:
            notes = Notes.query.filter_by(checked_day_id=checked_day.id).first()
            if notes:
                todays_notes[ghp.name] = notes.html_content
    
    return todays_notes

@main.route('/user/data', methods=['GET'])
@jwt_required()
def get_user_data():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Get the 'today' query parameter
    today_str = request.args.get('today')
    today = datetime.strptime(today_str, '%Y-%m-%d').date() if today_str else datetime.now().date()
    
    ghps_data = []
    for ghp in user.ghps:
        checked_days = sorted((day.date.strftime('%Y-%m-%d') for day in ghp.checked_days), reverse=True)
        current_streak, max_streak = calculate_streaks(checked_days, today)
        ghps_data.append({
            "id": ghp.id,
            "name": ghp.name,
            "checked_days": checked_days,
            "current_streak": current_streak,
            "max_streak": max_streak,
        })
    
    return jsonify({"ghps": ghps_data, "todays_notes": get_all_todays_notes(user_id, today)}), 200

@main.route('/ghp/<int:ghp_id>/check_days', methods=['GET'])
@jwt_required()
def get_check_days(ghp_id):
    user_id = get_jwt_identity()
    ghp = GHP.query.filter_by(id=ghp_id, user_id=user_id).first()
    if not ghp:
        return jsonify({"message": "GHP not found or unauthorized"}), 404
    
    checked_days = CheckedDay.query.filter_by(ghp_id=ghp_id).order_by(CheckedDay.date.desc()).all()
    return jsonify([{"date": day.date.strftime('%Y-%m-%d')} for day in checked_days]), 200

def calculate_streaks(checked_days, today):
    if not checked_days:
        return 0, 0
    
    checked_days = sorted(set(checked_days), reverse=True)  # Remove duplicates and sort
    
    current_streak = 0
    max_streak = 0
    streak = 0
    last_date = None
    
    for day in checked_days:
        date = datetime.strptime(day, '%Y-%m-%d').date()
        
        if last_date is None or (last_date - date).days == 1:
            streak += 1
        else:
            if streak > max_streak:
                max_streak = streak
            streak = 1
        
        last_date = date
    
    if streak > max_streak:
        max_streak = streak
    
    # Calculate current streak
    current_streak = 0
    for day in checked_days:
        date = datetime.strptime(day, '%Y-%m-%d').date()
        if date == today - timedelta(days=current_streak):
            current_streak += 1
        else:
            break
    
    return current_streak, max_streak