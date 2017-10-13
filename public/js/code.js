window.onload = () => {

    let form = document.forms[0];

    form.addEventListener('submit', submitHandler);

    function submitHandler(e) {
        e.preventDefault();

        let formData = new FormData(e.target);
        fetch('/xlstojson', {method: 'post', body: formData})
        .then( (res) => {
            if(res.status === 200) return res.json();
        })
        .then( (json) => {
            console.log(json);
        })
        .catch( (err) => {
            console.log(err);
        });

    }

}
