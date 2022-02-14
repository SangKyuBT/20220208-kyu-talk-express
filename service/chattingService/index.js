const _ = require( 'lodash' )
const common = require( '../../util/common' )

module.exports = {
  getChattingRoom: async function( conn, roomId ) {
    let res = await common.connPromise( conn, sql.seletCattingRoom, [ roomId ] )
    return common.connResultsAsCamelCase( res )
  },
  getUserChattingRoom: async function( conn, userId ) {
    let res = await common.connPromise( conn, sql.seletUserCattingRoom, [ userId ] )
    return common.connResultsAsCamelCase( res )
  },
  getMessageList: async function( conn, userId ) {
    let res = await common.connPromise( conn, sql.selectUserMessage, [ userId ] )
    let sendMessageList = common.connResultsAsCamelCase( res )
    
    res = await common.connPromise( conn, sql.selectFromMessage, [ userId ] )
    const fromMessageList = common.connResultsAsCamelCase( res )
    
    const messageList = _.concat( sendMessageList, fromMessageList )
    
    const roomIdList = _( messageList )
      .filter( 'roomId' )
      .join( ',' )
    
    res = await common.connPromise( conn, sql.seletCattingRoom, [ roomIdList ] )
    const chattingRoomList = common.connResultsAsCamelCase( res )

    return { messageList, chattingRoomList }
  },
  insertMessage: async function( conn, message ) {
    let res = await common.connPromise( conn, sql.insertMessage, [ 
      message.roomId, message.sendUserId, message.text, message.createDate
    ] )

    if( !res.results.insertId ) {
      throw new Error( 'message insert fail' )
    }
    
    return res.results.insertId
  },
  insertFromUser: async function( conn, fromUserList = [] ) {
    for( let i = 0; i < fromUserList.length; i++ ) {
      const { messageId, userId } = fromUserList[i]
      await common.connPromise( conn, sql.inserFromUser, [ messageId, userId ] )
    }
  },
}

const sql = {
  seletCattingRoom: `
    SELECT room_id, create_user_id, room_user
    FROM chatting_room
    WHERE room_id in ( ? )`,
  seletUserCattingRoom: `
    SELECT room_id, create_user_id, room_user
    FROM chatting_room
    WHERE create_user_id = ?`,
  selectUserMessage: `
    SELECT A.message_id, A.room_id, A.send_user_id, 
      A.create_date, A.modify_date, A.text,
      ( SELECT count( case when is_read IS NULL THEN 1 END ) 
        FROM from_user
        WHERE message_id = A.message_id ) as not_read_count,
      ( SELECT user_id 
        FROM from_user
        WHERE message_id = A.message_id limit 1 ) as user_id
    FROM message as A
    WHERE send_user_id = ?`,
  selectFromMessage: `
    SELECT B.message_id, B.room_id, B.send_user_id, 
      B.create_date, B.modify_date, B.text, A.user_id, A.is_read,
      ( SELECT count( case when is_read IS NULL THEN 1 END ) 
        FROM from_user
        WHERE message_id = B.message_id ) as not_read_count,
      ( SELECT name
        FROM user
        WHERE user_id = B.send_user_id ) as name
    FROM from_user as A
    INNER JOIN message as B on A.message_id = B.message_id
    WHERE A.user_id = ?`,
  insertMessage: `
    INSERT INTO message( room_id, send_user_id, text, create_date )
    VALUES( ?, ?, ?, ? )`,
  inserFromUser: `
    INSERT INTO from_user( message_id, user_id )
    VALUES( ?, ? )
  `
}