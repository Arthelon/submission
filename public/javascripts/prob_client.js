$(function() {
    var $subContent = $('#subContent')
    var $testContent = $('#testContent')
    var $createContent = $('#createContent')
    var $msg = $('.msg')

    $subContent.find('.cross').click(function() {
        var $index = $('i').index(this) + 1
        var $tableLink = $(this).parents('tbody').find('tr:nth-child(' + $index + ') td:nth-child(1) a')
        var sub_name = $tableLink.text()

        axios.delete('/room/'+room_name+'/'+sub_name).then(function(res) {
            if (!res.data.success) res.data.success = 'Success'
            $msg.append('<p style="color:green;">'+res.data.success+'</p>')
            $(this).parents('tbody').find('tr:nth-child(' + $index + ')').fadeOut(400, () => $(this).remove())
        }, function(res) {
            if (!res.data.error) res.data.error = 'Error Occurred'
            $msg.append('<p style="color:green;">'+res.data.error+'</p>')
        })
    })

    $testContent.find('.cross').click(function() {

    })

    $createContent.find('form').submit(function(e) {
        e.preventDefault()
        $.ajax({
            url: '/problem/'+room_name+'/'+prob_name,
            data: $(this).serialize(),
            method: 'POST',
            dataType: 'json'
        }).then(function(data) {
            if (!data.success) data.success = 'Success'
            $msg.append('<p style="color:green;">' + data.success + '</p>')
        }, function(data) {
            if (!data.error) data.error = 'Error'
            $msg.append('<p style="color:red;">' + data.error + '</p>')
        })
        $(this).trigger('reset')
    })

    $('.nav > li').click(function() {
        $(this).attr('class', 'active')
        $createContent.fadeOut(500, () => {
            if ($(this).index() != 0) {
                $('.nav > li:nth-child(1)').attr('class', '')
                $subContent.fadeOut(500, function() {
                    $testContent.fadeIn(300)
                })
            } else {
                $('.nav > li:nth-child(2)').attr('class', '')
                $testContent.fadeOut(500, function() {
                    $subContent.fadeIn(300)
                })
            }
        })
    })

    $('#createTest').click(function() {
        $testContent.fadeOut(500, function() {
            $createContent.fadeIn(300)
        })
    })
})