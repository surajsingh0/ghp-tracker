from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    ghps = db.relationship('GHP', backref='user', lazy=True)

class GHP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    checked_days = db.relationship('CheckedDay', backref='ghp', lazy=True)

class CheckedDay(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    ghp_id = db.Column(db.Integer, db.ForeignKey('ghp.id'), nullable=False)

class Notes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    html_content = db.Column(db.Text, nullable=False)
    checked_day_id = db.Column(db.Integer, db.ForeignKey('checked_day.id'), nullable=False)