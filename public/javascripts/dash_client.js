$(function() {
    $('.cross').click(function() {
        var index = $('i').index(this)+1
        var roomName = $('table tr:nth-child('+index+') td:nth-child(2)').text()
        $.ajax({
            type: "DELETE",
            url: '/_remove_room?'+ $.param({room_name: roomName})
        });
        $('table tr:nth-child('+index+')').fadeOut(400, () => $(this).remove())
    })
})