$(function() {
    $('.cross').click(function() {
        var $index = $('i').index(this) + 1
        var $tableLink = $(this).parents('tbody').find('tr:nth-child(' + $index + ') td:nth-child(1) a')
        var sub_name = $tableLink.text()

        $.ajax({
            type: "DELETE",
            url: '/room/_remove_sub/',
            dataType: 'json',
            data: {
                room_name: room_name,
                sub_name: sub_name
            }
        });
        $(this).parents('tbody').find('tr:nth-child(' + $index + ')').fadeOut(400, () => $(this).remove())
    })
})