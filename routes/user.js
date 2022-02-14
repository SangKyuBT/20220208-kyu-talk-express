var express = require('express');
var router = express.Router();
const _ = require( 'lodash' )
const mysql = require( '../util/mysql/connection' )
const userService = require( '../service/userService' )
const chattingService = require( '../service/chattingService' )

router.get('/getuserinfo', async function( req, res, next ) {
  let conn
  const userId = req.query.userId
  try {
    conn = await mysql.getConnection()

    const { user, friendList } = await userService.getUserInfo( conn, userId )
    let { messageList, chattingRoomList } = await chattingService.getMessageList( conn, userId )
    const userChattingRoomList = await chattingService.getUserChattingRoom( conn, userId )
    chattingRoomList = [ ...chattingRoomList, ...userChattingRoomList ]

    res.status( 200 ).send( { code: 200, payload: { user, friendList, chattingRoomList, messageList } } )
  } catch ( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

router.post('/login', async function( req, res, next ) {
  let conn
  const { userId, password } = req.body

  var test = [ "test", "test1", "test2" ]
  console.log( JSON.stringify( test ) )



  try {
    conn = await mysql.getConnection()

    conn.query( 'update chatting_room set room_user = ? where room_id = 1' [ test ] )


    const { user, friendList } = await userService.login( conn, userId, password )
    let { messageList, chattingRoomList } = await chattingService.getMessageList( conn, userId )
    const userChattingRoomList = await chattingService.getUserChattingRoom( conn, userId )
    chattingRoomList = [ ...chattingRoomList, ...userChattingRoomList ]

    res.status( 200 ).send( { code: 200, payload: { user, friendList, chattingRoomList, messageList } } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

router.post('/signupuser', async function( req, res, next ) {
  let conn
  const { user } = req.body

  if( user.password !== user.verificationPassword ) {
    res.status( 400 ).send( 'user went wrong' )
    return
  }

  try {
    conn = await mysql.getConnection()
    await userService.signUpUser( conn, user )
    res.status( 200 ).send( { code: 200, payload: { message: 'success' } } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    conn && conn.release()
  }
} )

router.get('/checkduplication', async function( req, res, next ) {
  let conn
  const { userId } = req.query

  try {
    conn = await mysql.getConnection()
    const result = await userService.checkUserDuplication( conn, userId )
    res.status( 200 ).send( { code: 200, payload: result } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    if( conn ) {
      conn.release()
    }
  }
} )

router.get('/searchuser', async function( req, res, next ) {
  let conn
  const { userId, searchWord } = req.query

  try {
    conn = await mysql.getConnection()
    const result = await userService.searchUser( conn, userId, searchWord )
    res.status( 200 ).send( { code: 200, payload: result } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    if( conn ) {
      conn.release()
    }
  }
} )

router.post( '/addfriend', async function( req, res, next ) {
  let conn
  const { userId, targetUserId } = req.body

  try {
    conn = await mysql.getConnection()
    await userService.addFriend( conn, userId, targetUserId )
    const result = await userService.getFriendList( conn, userId )
    res.status( 200 ).send( { code: 200, payload: result } )
  } catch( err ) {
    console.error( err )
    res.status( 500 ).send( err )
  } finally {
    if( conn ) {
      conn.release()
    }
  }
} )

module.exports = router;
