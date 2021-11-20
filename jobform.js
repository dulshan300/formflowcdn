(function () {
    // firebase setup
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase
        .auth()
        .signInWithEmailAndPassword(_femail, _fpass)
        .then((userCredential) => {
            var user = userCredential.user;
            window.user = user;
            console.log(user);
        })
        .catch((error) => {
            console.log(error);
        });
    var db = firebase.firestore();
    var persons = db.collection("applications");
    var storage = firebase.storage();
    var storageRef = storage.ref();

    var app = new Vue({
        el: "#app",
        data: {
            file_name: "",
            current_step: 1, // do not remove
            total_step: 0, // do not remove
            // Add your code below here 
            work_unite: "",
            work_unites: work_unites,
            file: null,
            file_url: "",
            name: "",
            phone_number: "",
            email: "",
            address:"",
            emp_type:[]
        },
        components: {
            Panel: panel(), // do not remove
        },
        watch: {
            emp_type:function(){
                console.log(this.emp_type);
            }
        },
        methods: {
            // step_finish will execute as the last step next function
            // do not remove
            step_finish: function () {
                console.log("Last step");
                this.current_step = 1;
                app.data_reset();
            },

            data_reset: function () {
                this.form_data = {};
            },
            // Add your code below here
            say: function () {
                console.log("say awasome");
                return true;
            },

            file_upload: function (e) {
                files = e.target.files;
                console.log(files[0]);
                if (files[0].size < 5200000) {
                    this.file = {};
                    this.file.file = files[0];
                    this.file.ext = files[0].type.split("/")[1];
                    this.file.name =
                        this.name +Date.now()+
                        "." +
                        files[0].type.split("/")[1];
                   
                    this.file_name = files[0].name;
                } else {
                    alert("Maximum size is 5mb");
                }
            },

            send_application: function () {
                if (this.validate()) {
                    
                }else{
                    return 0;
                }
            },
          
            validate: function () {
                var valid = true;
                $("#et").removeClass("error_text");
                $("#lblcv").removeClass("error_text");
                $(
                    "#msg input[required],#msg select[required], #msg textarea[required]"
                ).each(function () {
                    $(this).removeClass("error");                    
                    if ($(this).val() == "" || $(this).val() == null) {
                        $(this).addClass("error");
                        valid = false;
                    }
                    if (this.type == "email") {
                        var re =
                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        if (!re.test($(this).val())) {
                            $(this).addClass("error");
                            valid = false;
                        }
                    }

                    if (this.type == "file") {
                        if (!app.file) {                            
                            $("#lblcv").addClass("error_text");
                            valid = false;
                        }
                    }

                    if(app.emp_type.length == 0){
                        $("#et").addClass("error_text");
                    }
                });
                return valid;
            },           
            mail: async function () {
                var temp = $("#email_body").html();
                var template = Handlebars.compile(temp);
                var email_body_data = {
                    name: this.form_data.name,
                    mb_number: this.form_data.membership_no,
                    phone_number: this.form_data.phone_number,
                    email: this.form_data.email,
                    message: this.form_data.message,
                    delivery: this.form_data.delivery.name,
                    address: this.form_data.address,
                    file_url: this.file_url,
                   
                };
                // console.log(template(email_body_data));
                var form = new FormData();

                form.append("_api_key", EMAIL_API.public_key);
                form.append("_from", EMAIL_API.from[0]);
                form.append("_from_name", EMAIL_API.from[1]);
                form.append("_subject", EMAIL_API.subject);
                form.append("_sg_key", EMAIL_API.sendgrid_key);

                for (const to of EMAIL_API.to) {
                    form.append("_to[]", to);
                }
                form.append("_body", template(email_body_data));
                $.ajax({
                    url: EMAIL_API.api_url,
                    method: "POST",
                    data: form,
                    processData: false,
                    contentType: false,
                    crossDomain: true,
                    // dataType: "json",
                    success: function (data) {
                        console.log(data);
                    },
                });
            },
        },
    });
    // Panel Component
    function panel() {
        // Panel Component
        var panel = {
            props: ["step", "title", "action", "bnext", "dnext"],
            template: `<div :data-step="step" v-if="$parent.current_step==step" class="vue-panel card">     
        <div class="card-body">
            <div v-if="title">
                <h5 class="text-center">{{title}}</h5>
                <hr>
            </div>
            <div><slot></slot></div>
            <hr>
            <div class="d-flex justify-content-center">
                <button type="button" class="btn btn-secondary mr-1" v-if="isBack" v-on:click="back">Back</button>
                <button :disabled="$data._dnext" type="button" class="btn btn-primary" v-on:click="next"> 
                <span v-if="processing" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                {{$data._bnext}}</button>
            </div>
        </div>      
      </div>`,
            data: function () {
                return {
                    isBack: this.step == 1 ? false : true,
                    _bnext: this.bnext ? this.bnext : "Next",
                    _dnext: this.dnext ? this.dnext : false,
                    processing: false,
                };
            },
            methods: {
                next: async function () {
                    this.processing = true;
                    if (this.action) {
                        if (await this.$parent[this.action]()) {
                            if (
                                this.$parent.current_step ==
                                this.$parent.total_step
                            ) {
                                this.$parent.step_finish();
                            } else {
                                this.$parent.current_step++;
                            }
                        }
                    } else {
                        if (
                            this.$parent.current_step == this.$parent.total_step
                        ) {
                            this.$parent.step_finish();
                        } else {
                            this.$parent.current_step++;
                        }
                    }
                    this.processing = false;                    
                },
                back: function () {
                    this.$parent.current_step--;
                },
            },
            created: function () {
                this.$parent.total_step += 1;
                console.log("Panel Created");
            },
        };
        return panel;
    }
    // End Panel Component
})();