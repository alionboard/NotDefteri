// var apiUrl = "https://localhost:44300/";
var apiUrl = "https://notchuapi.alims.online/";
var pathname = window.location.pathname;


function getAccessToken() {
    var loginDataJson = sessionStorage["login"] || localStorage["login"];
    var loginData;

    try {
        loginData = JSON.parse(loginDataJson);
    }
    catch (error) {
        return null;
    }
    if (!loginData || !loginData.access_token) {
        return null;
    }
    return loginData.access_token;
};

function getAuthHeaders() {
    return { Authorization: "Bearer " + getAccessToken() };
};

// Notları önyüze getirme
function notlariGetir() {
    $.ajax({
        type: "get",
        headers: getAuthHeaders(),
        url: apiUrl + "api/Notlar/Listele",
        success: function (data) {
            notlariListele(data);
        },
        error: function (xhr) {
            console.log(xhr.responseJSON)
        }
    })
};

function notlariListele(notlar) {
    for (var i = 0; i < notlar.length; i++) {
        notEkle(notlar[i]);
    }
    notVarMi();
};
// 
function notEkle(not) {
    var html = '<li id="' + not.Id + '">' +
        '<span class="d-none" id="tarihSpan-' + not.Id + '">' + moment(not.Tarih).locale('tr').startOf('seconds').fromNow() + '</span>' +
        '<div class="wrapp">' +
        '<div><a class="notBaslik">' + not.Baslik + '</a><a class="silBtn"><i class="fas fa-trash float-right hide"></i></a></div>' +
        '<p class="not-content">' + not.Icerik + '</p>' +
        '</div>' +
        '</li>';
    $("#pills-home ul").prepend(html);
};

function girisKontrol() {
    if (pathname.endsWith("/giris.html")) return;

    // Varsa Tokeni alma
    var accessToken = getAccessToken();

    if (!accessToken) {
        window.location.href = "giris.html";
        return;
    }
    // Token geçerliliğini kontrol etme
    $.ajax({
        type: "get",
        headers: getAuthHeaders(),
        url: apiUrl + "api/Account/UserInfo",
        success: function (data) {
            notlariGetir();
            bildirim('info', 'Giriş Başarılı. Hoşgeldin ' + data.Email);
        },
        error: function (xhr, error, status) {
            console.log(xhr.responseJSON);
            window.location.href = "giris.html";
        }
    });

};

$("#girisForm").submit(function (event) {
    event.preventDefault();
    var hatirla = $("#benihatirla").prop("checked"); // true | false

    $.ajax({
        type: "POST",
        url: apiUrl + "Token",
        data: {
            grant_type: "password",
            username: $("#girisEposta").val(),
            password: $("#girisParola").val()
        },

        success: function (data) {
            localStorage.removeItem("login");
            sessionStorage.removeItem("login");
            var storage = hatirla ? localStorage : sessionStorage;
            storage["login"] = JSON.stringify(data);
            location.href = "/";

        },
        error: function (xhr, status, error) {
            if (xhr.responseJSON.error == "invalid_grant") {
                bildirim("error", "Tekrar deneyiniz!");
                $("#girisParola").val("");
            }
        },
    });

});

//Not yok yazısı
function notVarMi() {
    if ($('.ccontent li').length < 1) {
        $("#notYok").text("Hiç notunuz yok :(")
    }
    else {
        $("#notYok").text("");
    };
};

//Sisteme not ekleme
$("#notEkleFrm").submit(function (event) {
    event.preventDefault();
    var frm = this;
    $.ajax({
        type: "post",
        url: apiUrl + "api/Notlar/Ekle",
        headers: getAuthHeaders(),
        data: $(frm).serialize(),
        success: function (data) {
            notEkle(data);
            $("#pills-home-tab").click();
            frm.reset();
            notVarMi();
            bildirim('success', 'Not Eklendi!');
        },
        error: function (xhr, status, error) {
            console.log(xhr.responseJSON);
            bildirim('error', 'Not Eklenemedi!');
        }
    });
});

$("#notEkleIptalBtn").click(function (event) {
    $("#pills-home-tab").click();
});

$("#notDuzenleIptalBtn").click(function (event) {
    $("#pills-home-tab").click();
    $("#duzenleTab").addClass("d-none");
    $("#ekleTab").removeClass("d-none");
});

$("#notDuzenleFrm").submit(function (event) {
    event.preventDefault();
    var notli = $("#notId").val();
    var frm = this;
    $.ajax({
        type: "post",
        url: apiUrl + "api/Notlar/Duzenle",
        headers: getAuthHeaders(),
        data: $(frm).serialize(),
        success: function (data) {
            $("#" + notli).remove();
            notEkle(data);
            frm.reset();
            $("#pills-home-tab").click();
            $("#duzenleTab").addClass("d-none");
            $("#ekleTab").removeClass("d-none");
            bildirim('success', 'Not Kaydedildi!')
        },
        error: function (xhr, status, error) {
            console.log(xhr.responseJSON);
            bildirim('error', 'Not Kaydedilemedi!');
        }
    });
});

$("#pills-home-tab").click(function () {
    $("#duzenleTab").addClass("d-none");
    $("#ekleTab").removeClass("d-none");
});

//Not düzenleme ekranına geçiş
$("body").on("click", ".notBaslik", function (event) {
    var id = $(this).closest("li").attr("id");
    var tarih = $(this).closest("li").find("#tarihSpan-" + id).text();
    var baslik = $(this).text();
    var icerik = $(this).closest(".wrapp").find(".not-content").text();
    $("#notId").val(id);
    $("#baslikDuzenleText").val(baslik);
    $("#icerikDuzenleTextArea").val(icerik);
    $("#tarihP").text("Son düzenleme: " + tarih);
    $("#duzenleTab").removeClass("d-none");
    $("#ekleTab").addClass("d-none");

    $("#pills-duzenle-tab").click();
});

//Not Silme
$("body").on("click", ".silBtn", function (event) {
    var id = $(this).closest("li").attr("id");
    var li = $(this).closest("li");
    $.ajax({
        type: "GET",
        url: apiUrl + "api/Notlar/Sil/" + id,
        headers: getAuthHeaders(),
        success: function () {
            $(li).remove();
            notVarMi();
            bildirim('success', 'Silme İşlemi Başarılı!');

        },
        error: function (xhr, error, status) {
            bildirim('error', 'Silme İşlemi Başarısız!')
            console.log(xhr.responseJSON)
        }
    });

});

$("#btnCikisYap").click(function (event) {
    event.preventDefault();
    localStorage.removeItem("login");
    sessionStorage.removeItem("login");
    window.location.href = "giris.html";
});



$("#btnKayitForm").click(function () {
    $("#kayitForm").trigger("reset");
});

$("#kayitForm").submit(function (event) {
    event.preventDefault();
    var frm = this;
    $.ajax({
        type: "POST",
        url: apiUrl + "api/Account/Register",
        data: $(this).serialize(),
        success: function (data) {
            $("#girisEposta").val($("#kayitEposta").val());
            $("#girisParola").val($("#kayitParola").val());
            $("#girisForm").trigger("submit");
        },

        error: function (xhr, status, error) {
            console.log(xhr.responseJSON);
            if (xhr.responseJSON.ModelState["model.ConfirmPassword"]) {
                bildirim('error', 'Parolalar eşleşmiyor!');
            }
            else if (xhr.responseJSON.ModelState["model.Password"]) {
                bildirim('error', 'Parola en az 6 karakterden oluşmalıdır!');
            }
            else if (xhr.responseJSON.ModelState[""][0].includes("Passwords must have at least one uppercase ('A'-'Z').")) {
                bildirim('error', 'Parola en az bir büyük harf içermelidir!');
            }
            else if (xhr.responseJSON.ModelState[""][1]) {
                bildirim('error', 'Bu E-Posta kullanılıyor!');
            }
            else if (xhr.responseJSON.ModelState[""][0].includes('Passwords must have at least one non letter or digit character.')) {
                bildirim('error', 'Parola en az bir sayı ve özel karakter içermelidir!');
            }
            else {
                bildirim('error', 'Hata oluştu!');
            }
        }
    });

});

// Yükleniyor efekti
$(document).ajaxStart(function () {
    $("#loading").removeClass("d-none");
});
$(document).ajaxStop(function () {
    $("#loading").addClass("d-none");
});

//Bildirim
function bildirim(tip, mesaj) {
    var Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
    Toast.fire({
        icon: tip,
        title: mesaj
    })
}

$("#ara").on('input', updateValue);
function updateValue(e) {
    console.log(e.target.value);


    var column1RelArray = [];
    var list = $(".ccontent li").each(function () {
        if ($(this).includes(e.target.value)) {
            column1RelArray.push($(this).attr('id'))
        };
    })
    console.log(list);

}

girisKontrol();