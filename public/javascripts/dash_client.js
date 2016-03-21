$(function () {
    $('.cross').click(function () {
        var index = $('i').index(this) + 1
        var roomName = $('table tr:nth-child(' + index + ') td:nth-child(2)').text()
        var $msg = $('.msg')

        axios.delete('/room/'+roomName).then(function(res) {
            if (!res.data.success) res.data.success = 'Success'
            $msg.append('<p style="color:green;">'+res.data.success+'</p>')
        }, function(res) {
            if (!res.data.error) res.data.error = 'Error Occurred'
            $msg.append('<p style="color:green;">'+res.data.error+'</p>')
        })
        $('table tr:nth-child(' + index + ')').fadeOut(400, () => $(this).remove())
    })
})
