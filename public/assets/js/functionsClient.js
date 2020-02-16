function passParameter(root) {
    $.ajax({
        url: "bash",
        cache: false,
        contentType: false,
        processData: false,
        data: { "saludo": root },
        type: 'GET',
        success: function(data) {
            alert(data);
        }

    });
}