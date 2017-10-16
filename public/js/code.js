window.onload = () => {

    let form = document.forms[0];
    let flashMessage = document.getElementById('flashMessage');
    let status = document.getElementById('status');

    form.addEventListener('submit', submitHandler);

    function submitHandler(e) {
        e.preventDefault();

        let formData = new FormData(e.target);
        fetch('/xlstojson', {method: 'post', body: formData})
        .then( (res) => {
            if(res.status === 200) return res.json();
        })
        .then( (json) => {
            flashMessage.innerHTML = json.link;
            let link = document.querySelector('#flashMessage a');
            console.log(link);
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.target.classList.add('inactive');
                status.classList.remove('inactive');
                fetch(e.target.href, {method: 'get'})
                .then( (res) =>{
                    if(res.status === 200) {
                        // Проверка готовности стикеров!
                    }
                })
                .catch( (err) => console.log(err));
            });

        })
        .catch( (err) => {
            console.log(err);
        });

    }

}
