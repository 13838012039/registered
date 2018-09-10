var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}

var server = http.createServer(function(request, response) {
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method

    /******** 从这里开始看，上面不要看 ************/


    if (path === '/') {
        var string = fs.readFileSync('./sign_up.html', 'utf8')
        var users = fs.readFileSync('./db/users', 'utf8')
        try {
            users = JSON.parse(users)
        } catch (exception) {
            users = []
        }

        console.log('11+' + request.headers.cookie)
        let cookies = request.headers.cookie.split('; ')
        var hash = {}
        console.log(cookies)
        for (let i = 0; i < cookies.length; i++) {

            let parts = cookies[i].split('=')
            let key = parts[0]
            let value = parts[1]
            hash[key] = value
        }
        console.log(hash)
        let email = hash.sign_in_email

        let foundUser = false
        for (let i = 0; i < users.length; i++) {
            console.log(users[i].email)
            console.log(email)
            if (users[i].email === email) {
                foundUser = users[i]
                console.log(foundUser)
                break
            }

        }
        console.log(foundUser)
        if (foundUser) {
            string = string.replace('__password__', foundUser.password)
        } else {
            string = string.replace('__password__', '不知道')
        }


        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/css/style.css') {
        var string = fs.readFileSync('./css/style.css', 'utf8')
        response.setHeader('Content-Type', 'text/css')
        response.write(string)
        response.end()
    } else if (path === '/js/main.js') {
        var string = fs.readFileSync('./js/main.js', 'utf8')
        response.setHeader('Content-Type', 'application/javascript')

        response.write(string)
        response.end()
    } else if (path === '/sign_up' && method === 'GET') {
        let string = fs.readFileSync('./sign_up.html', 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/sign_in' && method === 'GET') {
        let string = fs.readFileSync('./sign_in.html', 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/sign_in' && method === 'POST') {
        readBody(request).then((body) => {
            console.log(body)
            let strings = body.split('&')
            let hash = {}
            strings.forEach(string => {
                let parts = string.split('=')
                let key = parts[0]
                let value = parts[1]
                hash[key] = decodeURIComponent(value)
            })


            let { email, password } = hash


            var users = fs.readFileSync('./db/users', 'utf8')

            try {
                users = JSON.parse(users)
            } catch (exception) {
                user = []
            }
            let found = false
            for (let i = 0; i < users.length; i++) {
                if (users[i].email === email && users[i].password === password) {
                    response.statusCode = 200
                    console.log('-------------------------------------')
                    found = true
                    break
                }

            }
            if (found) {
                response.setHeader('Set-Cookie', `sign_in_email=${email};HttpOnly`)
                response.write('OK')
                response.statusCode = 200
            } else {
                response.statusCode = 401
            }
            response.end()

        })
    } else if (path === '/sign_up' && method === 'POST') {
        readBody(request).then((body) => {
            console.log(body)
            let strings = body.split('&')
            let hash = {}
            strings.forEach(string => {
                let parts = string.split('=')
                let key = parts[0]
                let value = parts[1]
                hash[key] = decodeURIComponent(value)
            })


            let { email, password, password_confirmation } = hash

            console.log(hash)
            console.log(password)
            if (email.indexOf('@') === -1) {
                response.statusCode = 404
                response.setHeader('Content-Type', 'application/json;charset=utf-8')
                response.write(`{
                    "errors": {
                        "email":"invided"
                    }
                }`)
            } else if (password !== password_confirmation) {
                response.statusCode = 404
                response.write('password not match')
            } else {

                var users = fs.readFileSync('./db/users', 'utf8')

                try {
                    users = JSON.parse(users)
                } catch (exception) {
                    user = []
                }
                let inUse = false

                for (let i = 0; i < users.length; i++) {

                    let user = users[i]
                    if (user.email === email) {

                        inUse = true
                        break
                    }
                }
                if (inUse) {

                    response.statusCode = 400
                    response.write('email in uesr')
                } else {



                    users.push({ email: email, password: password })
                    var usersString = JSON.stringify(users)

                    fs.writeFileSync('./db/users', usersString)
                    response.statusCode = 200

                }


            }

            response.end()
        })

    }
    //  else if (path === '/pay') {
    //     var amount = fs.readFileSync('./db', 'utf8')
    //     var newAmount = amount - 1

    //     fs.writeFileSync('./db', newAmount)
    //     response.setHeader('Content-Type', 'application/javascript')

    //     response.statusCode = 200
    //     response.write(`
    //     ${query.callback}.call(undefined,'success')
    //     `)
    //     response.end()

    // } 
    else {
        response.statusCode = 404
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write('找不到路径，需要修改index.js')
        response.end()
    }







    /******** 代码结束，下面不要看 ************/
})

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = []
        request.on('data', (chunk) => {
            body.push(chunk)
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            resolve(body)
        })
    })
}

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)