'''
Created on Oct 20, 2010

@author: Jason Huang
'''
import tornado.auth
import simplejson
import bson
import StringIO
import pymongo
import datetime
import hmac
import unicodedata
import tornado.web
import MongoEncoder.MongoEncoder
import Users.Notification
import Users.Friend
from Map.BrowseTripHandler import BaseHandler
from boto.s3.connection import S3Connection
from boto.s3.key import Key

try:
  from PIL import Image
except ImportError:
  try:
    import Image
  except ImportError:
     print('To use ImageFields, you need to install the Python Imaging Library. Get it at http://www.pythonware.com/products/pil/ .')

import sys
def percent_cb(complete, total):
    sys.stdout.write('.')
    sys.stdout.flush()


class LoginHandler(BaseHandler):
    def get(self):
        self.render("login.html")
       
   
    def post(self):
        email = self.get_argument("email")
        password = self.get_argument("password")
        user = self.syncdb.users.find_one({'email':email})
        # use MD5 hash algorithm
        if user:
            #digest_marker = hmac.new(str(user["email"]))
            digest_marker = hmac.new(str(user['email']))
            digest_marker.update(password)
            real_password = digest_marker.hexdigest()
            print("check password")
            # if real_password == str(user["password"]):
            if real_password == str(user['password']):
                owner_id = user['user_id']
                self.set_secure_cookie("user", str(owner_id))
                self.redirect("/")
            else:
                self.redirect("/login")
        
        else:
            self.redirect("/login")

class CreateAccountHandler(BaseHandler):
    def get(self):
        self.render("signup.html")
    
    @tornado.web.asynchronous    
    def post(self):
        name = self.get_argument("username")
        email = self.get_argument("email")
        check  = self.syncdb.users.find_one( { 'email' : email })
        
        #check  = self.db.get("SELECT user_id from users where email = %s", email)
        slug = unicodedata.normalize("NFKD", name).encode("ascii", "ignore")
        if check:
                raise tornado.web.HTTPError(500, "TripShare auth failed because of duplicated email address");
        else:
                slug  = name
                
                while True:
                    e = self.syncdb.users.find_one({'slug':slug})
                    if not e: break
                    slug += "-2"
                password = self.get_argument("password")
                # use MD5 hash algorithm
                digest_marker = hmac.new(str(email), password)
                #digest_marker.update(password)
                real_password = digest_marker.hexdigest()
                #if os.path.dirname(__file__).endswith('Users'):
                #    static_path = os.path.dirname(__file__)[:-5]
                #picture = os.path.join(static_path, "static")+"/images/large-group.png"
                picture = "/static/images/large-group.png"
                
                user = {   'user_id' : bson.ObjectId(),
                           'username': name,
                           'lc_username': name.upper(),
                           'email': email,
                           'password': real_password,
                           'picture': picture,
                           'status': 'online',
                           'slug': slug,
                           'createdtime': datetime.datetime.utcnow(),
                           'city': [],
                           'country': [],
                           'trips':[],
                           'like_trip':[],
                           'bio':'',
                           'link': '',
                           'trip_count':0,
                           'like_guide':[],
                           'save_guide':[],
                           'friends':[],
                           'current_location':'',
                           'current_position':[],
                           'new_notifications':[],
                           'notifications':[],
                           'search_type':'person'
                               }
                
                self.db.users.insert(user, callback=self._on_action)
                
                #===============================================================
                # Store basic information in cookie
                #===============================================================
                self.set_secure_cookie("user", str(user['user_id']))
                self.set_secure_cookie("username", str(user['username']))
                self.set_secure_cookie("email", str(user['email']))
                self.set_secure_cookie("picture", str(user['picture']))
                
                
                self.redirect("/")
                
class AuthLogoutHandler(BaseHandler):
    def get(self):
        self.clear_cookie("user")
        self.redirect("/")

class AuthLoginFBHandler(BaseHandler, tornado.auth.FacebookGraphMixin):
    access_token = ''
    
    @tornado.web.asynchronous
    def get(self):
        my_url = (self.request.protocol + "://" + self.request.host +
                  "/auth/fblogin?next="+
                  tornado.escape.url_escape(self.get_argument("next", "/")))
        print(my_url)
        if self.get_argument("code", False):
            self.get_authenticated_user(
            redirect_uri=my_url,
            client_id=self.settings["facebook_api_key"],
            client_secret=self.settings["facebook_secret"],
            code=self.get_argument("code"),
            callback=self._on_auth)
            return
        self.authorize_redirect(redirect_uri=my_url,
                              client_id=self.settings["facebook_api_key"],
                              extra_params={"scope": "user_about_me,email,user_website,publish_stream,read_friendlists"})
 
    def handle_request(self, response):
        print('++++++++++++++++++++++++++++++'+response.body)
        user = simplejson.loads(response.body)
        print('-------------------------'+str(user[0]['uid']))
        
        _user = {   'fb_user_id' : str(user[0]['uid']),
                    'username': user[0]['name'],
                    'lc_username': user[0]['name'].upper(),
                    'web_url': user[0]['website'],
                    'locale':user[0]['locale'],
                    'email': user[0]['email'],
                    'picture': user[0]['pic'],
                    'current_location': user[0]['current_location'],
                    'current_position':[],
                    'access_token': self.access_token,
                    'save_guide':[],
                    'like_guide':[],
                    'friends':[],
                    'city': [],
                    'country': [],
                    'trips':[],
                    'like_trip':[],
                    'bio':'',
                    'link': '',
                    'trip_count':0,
                    'new_notifications':[],
                    'notifications':[],
                    'search_type':'person'
                    
                }
        _user_db = self.syncdb.users.find_one({'email': user[0]['email']})
        
        slug = unicodedata.normalize("NFKD", unicode(user[0]['name'])).encode("ascii", "ignore")
        while True:
                    e = self.syncdb.users.find_one({'slug':slug})
                    if not e: break
                    slug += "-2"
        
        user_id = ''
        if _user_db:    
            user_id = _user_db['user_id']
            _user['_id'] = _user_db['_id']
        else:
            user_id = _user['user_id'] = bson.ObjectId()
            _user['createdtime']=datetime.datetime.utcnow()
        _user['slug'] = slug
        self.db.users.save(_user, callback=self._on_action)
        self.set_secure_cookie("user", str(user_id))
        self.redirect(self.get_argument("next", "/"))
    
    def _on_auth(self, user):
        if not user:
            raise tornado.web.HTTPError(500, "Facebook auth failed")
        
        print(tornado.escape.json_encode(user))
        self.access_token = user['access_token']
        print(self.access_token)
        http_client = tornado.httpclient.AsyncHTTPClient()
       
        http_client.fetch("https://api.facebook.com/method/users.getInfo?uids="+user['id']+"&fields=uid%2C%20name%2C%20website%2C%20locale%2C%20pic%2C%20current_location%2C%20email&access_token="+self.access_token+"&format=json", self.handle_request)

        
class AuthLogoutFBHandler(BaseHandler, tornado.auth.FacebookGraphMixin):
    def get(self):
        self.clear_cookie("user")
        self.redirect(self.get_argument("next", "/"))

class TravelersHandler(BaseHandler):
    user = None
    @tornado.web.asynchronous
    def get(self, type):

        if (type == '' or type == 'friends'):
                self.db.users.find(sort = [('trips.count()', -1)], callback=self._people_entry)
        elif (type == 'active'):
                self.db.users.find(sort = [('trips.count()', -1)], callback=self._people_entry)
        elif (type == 'latest'):
                self.db.users.find(sort = [('createdtime', -1)] , callback=self._people_entry)  
        elif (type == 'nearest'):
                self.db.users.find({ 'current_position' : { '$near' : self.current_user['current_position']} } , callback=self._people_entry)  
        
        
    def _people_entry(self, response, error):
        if error:
            raise tornado.web.HTTPError(500)
        top_shares = self.syncdb.users.find().limit(10).sort("trip_count", pymongo.DESCENDING)
        self.render("travelers.html", users = response, top_shares = top_shares)

class UserHandler(BaseHandler):
    user = None
    
    @tornado.web.asynchronous
    def get(self, slug):
        
        self.user = self.syncdb.users.find_one({'slug':slug})
        if self.user:
            self.db.trips.find({'trip_id':{'$in':self.user['trips']}}, sort = [('published', -1)], callback=self._user_entry)
        else:
            self.redirect("exception.html")
                  
    def _user_entry(self, response, error):
        if error:
            raise tornado.web.HTTPError(500)
        
       
        self.render("userentry.html", custom_user = self.user, trips = response)

class AddUserToTripHandler(BaseHandler):
    userid = None
    tripid = None
    def get(self, userid, tripid):  
        self.userid = userid
        self.tripid = tripid
        user = self.syncdb.users.find_one({'user_id':bson.ObjectId(userid)})
        self.db.trips.update({'trip_id':bson.ObjectId(tripid)}, { '$addToSet':{'members': user}, '$inc' : { 'member_count' : 1 }}, callback = self._add_user_to_trip)  
    
    def _add_user_to_trip(self, response, error):
        if error:
            raise tornado.web.HTTPError(500)
        self.syncdb.users.update({'user_id':bson.ObjectId(self.userid)}, { '$addToSet':{'trips': self.tripid}})
        self.write('success') 
     
    

class CheckUserinTripHandler(BaseHandler):
    def get(self, userid, tripid):  
        trip = self.syncdb.trips.find_one({'trip_id':bson.ObjectId(tripid),  'members.user_id': bson.ObjectId(userid) } )
        if trip != '' and trip != None:
            #self.write(trip['slug']) 
            self.write('existed')
        else:
            self.write('nonexisted')
    

class FollowUserHandler(BaseHandler):  
    def post(self, userid):
        if self.current_user:
            user = self.syncdb.users.find_one({'owner_id': bson.ObjectId(userid)})
            self.db.users.update({'owner_id':bson.ObjectId(self.current_user['user_id'])}, { '$addToSet':{'friends': user} }, callback = self._user_follow)     
        else:
            self.redirect("exception.html")
    
    def _user_follow(self, response, error):
        if error:
            raise tornado.web.HTTPError(500)
        return "success"
        
class UnFollowUserHandler(BaseHandler):  
    def post(self, userid):
        if self.current_user:
            user = self.syncdb.users.find_one({'owner_id': bson.ObjectId(userid)})
            self.db.users.update({'owner_id':bson.ObjectId(self.current_user['user_id'])}, { '$pop':{'friends': user} }, callback = self._user_unfollow)     
        else:
            self.redirect("exception.html")
    
    def _user_unfollow(self, response, error):
        if error:
            raise tornado.web.HTTPError(500)
        return "success"       

class ImportFriendHandler(BaseHandler):
    def post(self):
        type = self.get_argument('type')
        
        
class GetFriendHandler(BaseHandler):  
    def get(self):    
        
        user = self.syncdb.users.find_one({'user_id': {'$regex':bson.ObjectId(self.current_user['user_id'])}})
        if user:
            self.write(unicode(simplejson.dumps(user['friends'], cls=MongoEncoder.MongoEncoder.MongoEncoder)))

class FriendRemoveHandler(BaseHandler):  
    @tornado.web.authenticated
    def post(self):
        user_id = self.get_argument('user_id')
        friend= self.syncdb.users.find_one({'user_id':bson.ObjectId(user_id)})
        _temp_friend = Users.Friend.FriendRequestHandler(friend)
        for item in self.current_user['friends']:
            if user_id == item['user_id']:
                self.syncdb.users.update({'user_id':bson.ObjectId(self.current_user['user_id'])}, {'$pull':{'friends':_temp_friend.temp_friend}})
                _temp_friend = Users.Friend.FriendRequestHandler(self.current_user)   
                self.syncdb.users.update({'user_id':bson.ObjectId(user_id)}, {'$pull':{'friends':_temp_friend.temp_friend}})
                   
            
class FriendRequestHandler(BaseHandler):  
    @tornado.web.authenticated
    def post(self):
        user_id = self.get_argument('user_id')
        _notification = Users.Notification.NotificationGenerator('friend_request', self.current_user['username'], self.current_user['slug'], self.current_user['picture'], datetime.datetime.utcnow(), self.current_user['user_id'])
        
        _temp_friend = Users.Friend.FriendRequestHandler(self.current_user)
        self.syncdb.users.update({'user_id':bson.ObjectId(user_id)}, {'$addToSet':{'new_notifications':_notification.notification}})
        self.syncdb.users.update({'user_id':bson.ObjectId(user_id)}, {'$addToSet':{'notifications':_notification.notification}})
        self.syncdb.users.update({'user_id':bson.ObjectId(user_id)}, {'$addToSet':{'friends_request_receive':_temp_friend.temp_friend}})
        
        friend= self.syncdb.users.find_one({'user_id':bson.ObjectId(user_id)})
        _temp_friend = Users.Friend.FriendRequestHandler(friend)
        self.syncdb.users.update({'user_id':bson.ObjectId(self.current_user['user_id'])}, {'$addToSet':{'friends_request_send':_temp_friend.temp_friend}})



class FriendConfirmHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        user_id = self.get_argument('user_id')
        type = self.get_argument('type')
        friend= self.syncdb.users.find_one({'user_id':bson.ObjectId(user_id)})
        if friend:
            _temp_friend = Users.Friend.FriendRequestHandler(friend)
            if type == 'accept':
                self.syncdb.users.update({'user_id':bson.ObjectId(self.current_user['user_id'])}, {'$addToSet':{'friends':_temp_friend.temp_friend}})
                _temp_friend = Users.Friend.FriendRequestHandler(self.current_user)   
                self.syncdb.users.update({'user_id':bson.ObjectId(user_id)}, {'$addToSet':{'friends':_temp_friend.temp_friend}})
                print('accept')
            elif type == 'decline':
                self.syncdb.users.update({'user_id':bson.ObjectId(self.current_user['user_id'])}, {'$pull':{'friends_request_receive':_temp_friend.temp_friend}})
                _temp_friend = Users.Friend.FriendRequestHandler(self.current_user)   
                self.syncdb.users.update({'user_id':bson.ObjectId(user_id)}, {'$pull':{'friends_request_send':_temp_friend.temp_friend}})
                print('decline')
        else:
            print('error')


           
class UpdateUserProfileHandler(BaseHandler):
    @tornado.web.authenticated
    @tornado.web.asynchronous 
    def post(self): 
        user_id = self.get_secure_cookie("user")
        if not user_id: return None
        
        bio = self.get_argument('description')
        self.syncdb.users.update({"user_id": bson.ObjectId(user_id)}, {"$set": { "bio": bio}})
        
        if len(self.request.files)>0:
            file = self.request.files['picture'][0]
        #file = self.request.files.get('picture')[0]
            if not file: return None

            local_file_path = "/tmp/" +str(user_id) +str(file['filename'])
            output_file = open(local_file_path, 'w')
            output_file.write(file['body'])
        
            size = 50, 40

            im = Image.open(StringIO.StringIO(self.request.files.items()[0][1][0]['body']))
        
            im.thumbnail(size, Image.ANTIALIAS)
            im.save(local_file_path + ".thumbnail", "JPEG")
        
            s3_path = "/userpix_thumbs/"+str(user_id)+str(file['filename'])
        
            access_key = "AKIAJLDHNWC3WXD6PGVA"
            secret_key = "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"
            bucket = "tripshare"

            conn = S3Connection(access_key, secret_key)
            bucket = conn.get_bucket(bucket)
        
            k = Key(bucket)
            k.key = s3_path
            k.set_contents_from_filename(local_file_path, cb=percent_cb, num_cb=10)
            k.set_acl('public-read')
            output_file.close()
            self.syncdb.users.update({"user_id": bson.ObjectId(user_id)}, {"$set": { "picture": "http://tripshare.s3.amazonaws.com"+s3_path}}, upsert = False, safe=True)
        
        self.redirect('/settings')
         
     
     
class UserPictureHandler(BaseHandler):
    
    @tornado.web.authenticated
    @tornado.web.asynchronous 
    def post(self):
        user_id = self.get_secure_cookie("user")
        if not user_id: return None
        file = self.request.files['picture'][0]
        #file = self.request.files.get('picture')[0]
        if not file: return None

        local_file_path = "/tmp/" +str(user_id) +str(file['filename'])
        
        #print('file:++++++++++++++++='+local_file_path)
        output_file = open(local_file_path, 'w')
        output_file.write(file['body'])
        
        size = 50, 40
        
        
        #im = Image.open(str(file['filename']))
        im = Image.open(StringIO.StringIO(self.request.files.items()[0][1][0]['body']))
        
        im.thumbnail(size, Image.ANTIALIAS)
        im.save(local_file_path + ".thumbnail", "JPEG")
        
        s3_path = "/userpix_thumbs/"+str(user_id)+str(file['filename'])
        
        access_key = "AKIAJLDHNWC3WXD6PGVA"
        secret_key = "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"
        bucket = "tripshare"

        conn = S3Connection(access_key, secret_key)
        bucket = conn.get_bucket(bucket)
        
        k = Key(bucket)
        k.key = s3_path
        k.set_contents_from_filename(local_file_path, cb=percent_cb, num_cb=10)
        k.set_acl('public-read')
       
        
        #os.remove(local_file_path + ".thumbnail")
        self.syncdb.users.update({"user_id": bson.ObjectId(user_id)}, {"$set": { "picture": "http://tripshare.s3.amazonaws.com"+s3_path}}, upsert = False, safe=True)
        #print (str(result))
        
        self.redirect('/')
    
class UserSettingHandler(BaseHandler):
    @tornado.web.asynchronous
    @tornado.web.authenticated
    def post(self):
         _formData = simplejson.loads(self.get_argument('data'))

class UserEntryModule(tornado.web.UIModule):
    def render(self):
        return self.render_string("Module/userentry.html")
    
class UserSettingModule(tornado.web.UIModule):
    def render(self):
        return self.render_string("Module/usersetting.html")
        