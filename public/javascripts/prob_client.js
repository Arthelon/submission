$(function() {
    $('.cross').click(function() {
        var $index = $('i').index(this) + 1
        var $tableLink = $(this).parents('table').find('tr:nth-child(' + $index + ') td:nth-child(1) a')
        var sub_name = $tableLink.text()
        console.log(room_name)
        console.log(sub_name)

        $.ajax({
            type: "DELETE",
            url: '/room/_remove_sub/',
            dataType: 'json',
            data: {
                room_name: room_name,
                sub_name: sub_name
            }
        });
        $(this).parents('table').find('tr:nth-child(' + $index + ')').fadeOut(400, () => $(this).remove())
    })
})