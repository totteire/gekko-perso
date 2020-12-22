const Push = require('pushover-notifications')

var p = new Push({
    user: 'ujjvrbm47vzigntk28ycg7bc3rz844',
    token: 'amc56x599qgw3a6c8jevd688izojq2',
})

module.exports.sendNotification = ({ title, message }) => {
    const msg = {
        title: title,
        message: message,
        sound: 'magic',
        device: 'TiboH6X',
        priority: 1
    }

    p.send(msg, function (err, result) {
        if (err) {
            throw err
        }

        console.log(result)
    })

}